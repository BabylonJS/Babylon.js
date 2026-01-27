import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import { EffectRenderer, EffectWrapper } from "core/Materials/effectRenderer";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { Nullable } from "core/types";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Vector2 } from "core/Maths/math.vector";
import { WhenTextureReadyAsync } from "core/Misc/textureTools";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Constants } from "core/Engines/constants";

type KernelData = {
    kernel: Float32Array;
    kernelSize: number;
    kernelHalfSize: number;
};

/**
 * Class used for fast copy from one texture to another
 */
export class AreaLightTextureTools {
    private _engine: AbstractEngine;
    private _renderer: EffectRenderer;
    private _effectWrapper: EffectWrapper;
    private _source: BaseTexture;
    private _scalingRange: Vector2;
    private _kernelLibrary: KernelData[] = [];
    private readonly _blurSize = 5;
    private readonly _alphaFactor = 0.5;

    /** Shader language used */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    private _textureIsInternal(texture: InternalTexture | ThinTexture): texture is InternalTexture {
        return (texture as ThinTexture)?.getInternalTexture === undefined;
    }

    /**
     * Constructs a new instance of the class
     * @param engine The engine to use for the copy
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;
        this._renderer = new EffectRenderer(this._engine);
        this._scalingRange = new Vector2();

        for (let i = 0; i < 512; i++) {
            const kernelSize = this._blurSize + (i + 1) * 2;
            const alpha = (kernelSize / 2.0) * this._alphaFactor;
            this._kernelLibrary.push(this._generateGaussianKernel(kernelSize, alpha));
        }
    }

    private _shadersLoaded = false;
    private _createEffect(): EffectWrapper {
        const engine = this._engine;
        let isWebGPU = false;

        if (engine?.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
            isWebGPU = true;
        }

        const effectWrapper = new EffectWrapper({
            engine: engine,
            name: "AreaLightTextureProcessing",
            fragmentShader: "areaLightTextureProcessing",
            useShaderStore: true,
            uniformNames: ["scalingRange"],
            samplerNames: ["textureSampler"],
            defines: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await import("../ShadersWGSL/areaLightTextureProcessing.fragment");
                } else {
                    await import("../Shaders/areaLightTextureProcessing.fragment");
                }
            },
        });

        effectWrapper.onApplyObservable.add(() => {
            engine.depthCullingState.depthMask = false;
            if (this._textureIsInternal(this._source)) {
                effectWrapper.effect._bindTexture("textureSampler", this._source);
            } else {
                effectWrapper.effect.setTexture("textureSampler", this._source);
            }
            effectWrapper.effect.setVector2("scalingRange", this._scalingRange);
        });

        return effectWrapper;
    }

    /**
     * Indicates if the effect is ready to be used for the copy
     * @returns true if "copy" can be called without delay, else false
     */
    public isReady(): boolean {
        return this._shadersLoaded && !!this._effectWrapper?.effect?.isReady();
    }

    /**
     * Pre-processes the texture to be used with RectAreaLight emissionTexture.
     * @param source The texture to pre-process
     * @returns A promise that resolves with the pre-processed texture
     */
    public async processAsync(source: BaseTexture): Promise<Nullable<BaseTexture>> {
        if (!this._shadersLoaded) {
            this._effectWrapper = this._createEffect();
            await this._effectWrapper.effect.whenCompiledAsync();
            this._shadersLoaded = true;
        }

        if (!source.isReady()) {
            await WhenTextureReadyAsync(source);
        }

        this._scalingRange.x = 0.125;
        this._scalingRange.y = 0.875;

        this._source = source;
        const oldWrapU = this._source.wrapU;
        const oldWrapV = this._source.wrapV;

        this._source.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._source.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;

        const result = await this._scaleImageDownAsync(source);
        await this._applyProgressiveBlurAsync(result);

        result.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        result.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

        this._source.wrapU = oldWrapU;
        this._source.wrapV = oldWrapV;

        return result;
    }

    private async _scaleImageDownAsync(source: BaseTexture): Promise<BaseTexture> {
        const renderTarget = this._engine.createRenderTargetTexture(
            { width: 1024, height: 1024 },
            {
                generateDepthBuffer: false,
                generateMipMaps: true,
                generateStencilBuffer: false,
                samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
                type: Constants.TEXTURE_2D,
                format: Constants.TEXTUREFORMAT_RGBA,
            }
        );

        this._source = source;
        const engineDepthMask = this._engine.getDepthWrite(); // for some reasons, depthWrite is not restored by EffectRenderer.restoreStates
        this._renderer.render(this._effectWrapper, renderTarget);
        this._engine.setDepthWrite(engineDepthMask);
        return new BaseTexture(this._engine, renderTarget.texture);
    }

    private _generateGaussianKernel(size: number, sigma: number): KernelData {
        if (size % 2 === 0) {
            throw new Error("Kernel size must be odd.");
        }

        const kernel = new Float32Array(size);
        let sum = 0.0;
        const halfSize = Math.floor(size / 2);

        for (let i = -halfSize; i <= halfSize; ++i) {
            const value = Math.exp(-(i * i) / (2.0 * sigma * sigma));
            const index = i + halfSize;
            kernel[index] = value;
            sum += value;
        }

        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }

        return { kernel, kernelSize: size, kernelHalfSize: halfSize };
    }

    private _mirrorIndex(x: number, width: number): number {
        if (x < 0) {
            x = -x;
        }
        if (x >= width) {
            x = 2 * width - 2 - x;
        }
        return x;
    }

    private _applyGaussianBlurRange(input: Uint8Array, output: Uint8Array, width: number, height: number, channels: number, kernelLibrary: KernelData[]) {
        const marginStart = Math.floor(width * 0.125);
        const marginEnd = Math.floor(width * 0.875);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let targetKernel = 0;

                if (x <= marginStart) {
                    targetKernel = Math.max(targetKernel, Math.abs(x - marginStart));
                }
                if (y <= marginStart) {
                    targetKernel = Math.max(targetKernel, Math.abs(y - marginStart));
                }
                if (x >= marginEnd) {
                    targetKernel = Math.max(targetKernel, Math.abs(x - marginEnd));
                }
                if (y >= marginEnd) {
                    targetKernel = Math.max(targetKernel, Math.abs(y - marginEnd));
                }

                const kernelData = kernelLibrary[targetKernel];
                const { kernel, kernelHalfSize } = kernelData;

                for (let c = 0; c < channels - 1; c++) {
                    let sum = 0.0;
                    for (let kx = -kernelHalfSize; kx <= kernelHalfSize; kx++) {
                        const px = this._mirrorIndex(x + kx, width);
                        const weight = kernel[kx + kernelHalfSize];
                        const pixelData = input[(y * width + px) * channels + c];
                        sum += pixelData * weight;
                    }
                    output[(y * width + x) * channels + c] = Math.max(0, Math.min(255, Math.round(sum)));
                }
                // copy alpha if present
                if (channels > 3) {
                    output[(y * width + x) * channels + (channels - 1)] = input[(y * width + x) * channels + (channels - 1)];
                }
            }
        }
    }

    private _transposeImage(input: Uint8Array, width: number, height: number, channels: number, output: Uint8Array): void {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcBase = (y * width + x) * channels;
                const dstBase = (x * height + y) * channels;
                for (let c = 0; c < channels; c++) {
                    output[dstBase + c] = input[srcBase + c];
                }
            }
        }
    }

    private async _applyProgressiveBlurAsync(source: BaseTexture): Promise<void> {
        const pixelData = await source.readPixels();

        if (!pixelData) {
            return;
        }

        const internalTexture = source.getInternalTexture();

        if (!internalTexture) {
            return;
        }

        const rourcePixel = new Uint8Array(pixelData.buffer);
        const result = new Uint8Array(rourcePixel.length);

        this._applyGaussianBlurRange(rourcePixel, result, internalTexture.width, internalTexture.height, 4, this._kernelLibrary);
        this._transposeImage(result, internalTexture.width, internalTexture.height, 4, rourcePixel);
        this._applyGaussianBlurRange(rourcePixel, result, internalTexture.width, internalTexture.height, 4, this._kernelLibrary);
        this._transposeImage(result, internalTexture.width, internalTexture.height, 4, rourcePixel);
        this._engine.updateRawTexture(internalTexture, rourcePixel, internalTexture.format, false);
    }

    /**
     * Releases all the resources used by the class
     */
    public dispose(): void {
        this._effectWrapper?.dispose();
        this._renderer.dispose();
    }
}
