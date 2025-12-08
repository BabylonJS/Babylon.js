import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import { Constants } from "core/Engines/constants";
import type { Nullable } from "core/types";

import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Conversion modes available when copying a texture into another one
 */
export const enum ConversionMode {
    None = 0,
    ToLinearSpace = 1,
    ToGammaSpace = 2,
}

/**
 * Class used for fast copy from one texture to another
 */
export class CopyTextureToTexture {
    private _engine: AbstractEngine;
    private _isDepthTexture: boolean;
    private _renderer: EffectRenderer;
    private _effectWrapper: EffectWrapper;
    private _source: InternalTexture | ThinTexture;
    private _conversion: number;
    private _lodLevel: number;

    /** Shader language used */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    /**
     * Gets the effect wrapper used for the copy
     */
    public get effectWrapper() {
        return this._effectWrapper;
    }

    /**
     * Gets or sets the source texture
     */
    public get source() {
        return this._source;
    }

    public set source(texture: InternalTexture | ThinTexture) {
        this._source = texture;
    }

    /**
     * Gets or sets the LOD level to copy from the source texture
     */
    public get lodLevel(): number {
        return this._lodLevel;
    }

    public set lodLevel(level: number) {
        this._lodLevel = level;
    }

    private _textureIsInternal(texture: InternalTexture | ThinTexture): texture is InternalTexture {
        return (texture as ThinTexture).getInternalTexture === undefined;
    }

    /**
     * Constructs a new instance of the class
     * @param engine The engine to use for the copy
     * @param isDepthTexture True means that we should write (using gl_FragDepth) into the depth texture attached to the destination (default: false)
     * @param sameSizeCopy True means that the copy will be done without any sampling (more efficient, but requires the source and destination to be of the same size) (default: false)
     */
    constructor(engine: AbstractEngine, isDepthTexture = false, sameSizeCopy = false) {
        this._engine = engine;
        this._isDepthTexture = isDepthTexture;
        this._lodLevel = 0;
        this._conversion = ConversionMode.None;

        this._renderer = new EffectRenderer(engine);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync(isDepthTexture, sameSizeCopy);
    }

    private _shadersLoaded = false;
    private async _initShaderSourceAsync(isDepthTexture: boolean, sameSizeCopy: boolean) {
        const engine = this._engine;

        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;

            await import("../ShadersWGSL/copyTextureToTexture.fragment");
        } else {
            await import("../Shaders/copyTextureToTexture.fragment");
        }

        this._shadersLoaded = true;

        const defines: string[] = [];

        if (isDepthTexture) {
            defines.push("#define DEPTH_TEXTURE");
        }
        if (sameSizeCopy) {
            defines.push("#define NO_SAMPLER");
        }

        this._effectWrapper = new EffectWrapper({
            engine: engine,
            name: "CopyTextureToTexture",
            fragmentShader: "copyTextureToTexture",
            useShaderStore: true,
            uniformNames: ["conversion", "lodLevel"],
            samplerNames: ["textureSampler"],
            defines,
            shaderLanguage: this._shaderLanguage,
        });

        this._effectWrapper.onApplyObservable.add(() => {
            if (isDepthTexture) {
                engine.setState(false);
                engine.setDepthBuffer(true);
                engine.depthCullingState.depthMask = true;
                engine.depthCullingState.depthFunc = Constants.ALWAYS;
            } else {
                engine.depthCullingState.depthMask = false;
                // other states are already set by EffectRenderer.applyEffectWrapper
            }

            if (this._textureIsInternal(this._source)) {
                this._effectWrapper.effect._bindTexture("textureSampler", this._source);
            } else {
                this._effectWrapper.effect.setTexture("textureSampler", this._source);
            }
            this._effectWrapper.effect.setFloat("conversion", this._conversion);
            this._effectWrapper.effect.setFloat("lodLevel", this._lodLevel);
        });
    }

    /**
     * Indicates if the effect is ready to be used for the copy
     * @returns true if "copy" can be called without delay, else false
     */
    public isReady(): boolean {
        return this._shadersLoaded && !!this._effectWrapper?.effect?.isReady();
    }

    /**
     * Copy one texture into another
     * @param source The source texture
     * @param destination The destination texture. If null, copy the source to the currently bound framebuffer
     * @param conversion The conversion mode that should be applied when copying
     * @param lod The LOD level to copy from the source texture
     * @returns
     */
    public copy(
        source: InternalTexture | ThinTexture,
        destination: Nullable<RenderTargetWrapper | IRenderTargetTexture> = null,
        conversion = ConversionMode.None,
        lod = 0
    ): boolean {
        if (!this.isReady()) {
            return false;
        }

        this._source = source;
        this._conversion = conversion;
        this._lodLevel = lod;

        const engineDepthFunc = this._engine.getDepthFunction();
        const engineDepthMask = this._engine.getDepthWrite(); // for some reasons, depthWrite is not restored by EffectRenderer.restoreStates

        this._renderer.render(this._effectWrapper, destination);

        this._engine.setDepthWrite(engineDepthMask);

        if (this._isDepthTexture && engineDepthFunc) {
            this._engine.setDepthFunction(engineDepthFunc);
        }

        return true;
    }

    /**
     * Releases all the resources used by the class
     */
    public dispose(): void {
        this._effectWrapper?.dispose();
        this._renderer.dispose();
    }
}
