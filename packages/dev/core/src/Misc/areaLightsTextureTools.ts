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
            uniformNames: ["texelSize"],
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

    public async processAsync(source: InternalTexture | ThinTexture): Promise<Nullable<InternalTexture | ThinTexture>> {
        return await this._processAsync(source);
    }

    /**
     * Copy one texture into another
     * @param source The source texture
     * @returns
     */
    public async _processAsync(source: InternalTexture | ThinTexture): Promise<Nullable<InternalTexture | ThinTexture>> {
        if (!this._shadersLoaded) {
            this._effectWrapper = this._createEffect();
            await this._effectWrapper.effect.whenCompiledAsync();
            this._shadersLoaded = true;
        }

        let wight = 0;
        let height = 0;
        let format = 0;
        let samplingMode = 0;
        let type = 0;

        this._source = source;

        if (this._textureIsInternal(this._source)) {
            const internalTexture = this._source as InternalTexture;
            wight = internalTexture.width;
            height = internalTexture.height;
            format = internalTexture.format;
            samplingMode = internalTexture.samplingMode;
            type = internalTexture.type;
        } else {
            const thinTexture = this._source as ThinTexture;
            const size = thinTexture.getSize();
            wight = size.width;
            height = size.height;

            const internalTexture = thinTexture.getInternalTexture();

            if (internalTexture) {
                format = internalTexture.format;
                samplingMode = internalTexture.samplingMode;
                type = internalTexture.type;
            }
        }

        // Hold the output of the decoding.
        const renderTarget = this._engine.createRenderTargetTexture(
            { width: wight, height: height },
            {
                generateDepthBuffer: false,
                generateMipMaps: false,
                generateStencilBuffer: false,
                samplingMode: samplingMode,
                type: type,
                format: format,
            }
        );

        this._effectWrapper.effect.setVector2("texelSize", new Vector2(1 / wight, 1 / height));
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
