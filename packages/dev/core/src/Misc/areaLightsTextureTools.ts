import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import type { Nullable } from "core/types";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Vector2 } from "core/Maths";

/**
 * Class used for fast copy from one texture to another
 */
export class AreaLightTextureTools {
    private _engine: AbstractEngine;
    private _renderer: EffectRenderer;
    private _effectWrapper: EffectWrapper;
    private _source: InternalTexture | ThinTexture;
    private _blurDirection: Vector2;
    private _textureResolution: Vector2;
    private _rangeFilter: Vector2;
    private _scalingRange: Vector2;

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
        this._blurDirection = new Vector2(1, 0);
        this._textureResolution = new Vector2(1024, 1024);
        this._rangeFilter = new Vector2();
        this._scalingRange = new Vector2();
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
            uniformNames: ["textureResolution", "blurDirection", "rangeFilter", "scalingRange"],
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
            effectWrapper.effect.setVector2("textureResolution", this._textureResolution);
            effectWrapper.effect.setVector2("blurDirection", this._blurDirection);
            effectWrapper.effect.setVector2("rangeFilter", this._rangeFilter);
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

    public async processAsync(source: ThinTexture): Promise<Nullable<ThinTexture>> {
        if (!this._shadersLoaded) {
            this._effectWrapper = this._createEffect();
            await this._effectWrapper.effect.whenCompiledAsync();
            this._shadersLoaded = true;
        }

        if (!source.isReady()) {
            return null;
        }

        this._rangeFilter.x = 0.125;
        this._rangeFilter.y = 0.875;
        this._scalingRange.x = 0.125;
        this._scalingRange.y = 0.875;

        let width = 0;
        let height = 0;
        let format = 0;
        let samplingMode = 0;
        let type = 0;
        this._source = source;
        this._source.wrapU = 0;
        this._source.wrapV = 0;

        const thinTexture = this._source as ThinTexture;
        const size = thinTexture.getSize();
        width = size.width;
        height = size.height;

        const internalTexture = thinTexture.getInternalTexture();

        if (internalTexture) {
            format = internalTexture.format;
            samplingMode = internalTexture.samplingMode;
            type = internalTexture.type;
        }

        this._textureResolution.x = width;
        this._textureResolution.y = height;

        this._blurDirection.x = 1;
        this._blurDirection.y = 0;

        let result = await this._processAsync(source, width, height, samplingMode, type, format);

        this._scalingRange.x = 0;
        this._scalingRange.y = 1;

        this._blurDirection.x = 0;
        this._blurDirection.y = 1;

        result = await this._processAsync(source, width, height, samplingMode, type, format);

        return result;
    }

    private async _processAsync(source: ThinTexture, width: number, height: number, samplingMode: number, type: number, format: number): Promise<Nullable<ThinTexture>> {
        this._source = source;
        // Hold the output of the decoding.
        const renderTarget = this._engine.createRenderTargetTexture(
            { width: width, height: height },
            {
                generateDepthBuffer: false,
                generateMipMaps: false,
                generateStencilBuffer: false,
                samplingMode: samplingMode,
                type: type,
                format: format,
            }
        );

        const engineDepthMask = this._engine.getDepthWrite(); // for some reasons, depthWrite is not restored by EffectRenderer.restoreStates
        this._renderer.render(this._effectWrapper, renderTarget);
        this._engine.setDepthWrite(engineDepthMask);

        if (this._textureIsInternal(this._source)) {
            const internalTexture = this._source as InternalTexture;
            renderTarget._swapAndDie(internalTexture);
        } else {
            const thinTexture = this._source as ThinTexture;
            const internalTexture = thinTexture.getInternalTexture();

            if (internalTexture) {
                renderTarget._swapAndDie(internalTexture);
            }
        }
        return source;
    }

    /**
     * Releases all the resources used by the class
     */
    public dispose(): void {
        this._effectWrapper?.dispose();
        this._renderer.dispose();
    }
}
