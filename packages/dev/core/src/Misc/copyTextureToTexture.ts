import type { ThinEngine } from "core/Engines/thinEngine";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import { Constants } from "core/Engines/constants";

import "../Shaders/copyTextureToTexture.fragment";

/**
 * Conversion modes available when copying a texture into another one
 */
export enum ConversionMode {
    None = 0,
    ToLinearSpace = 1,
    ToGammaSpace = 2,
}

/**
 * Class used for fast copy from one texture to another
 */
export class CopyTextureToTexture {
    private _engine: ThinEngine;
    private _isDepthTexture: boolean;
    private _renderer: EffectRenderer;
    private _effectWrapper: EffectWrapper;
    private _source: InternalTexture | ThinTexture;
    private _conversion: number;

    private _textureIsInternal(texture: InternalTexture | ThinTexture): texture is InternalTexture {
        return (texture as ThinTexture).getInternalTexture === undefined;
    }

    /**
     * Constructs a new instance of the class
     * @param engine The engine to use for the copy
     * @param isDepthTexture True means that we should write (using gl_FragDepth) into the depth texture attached to the destination (default: false)
     */
    constructor(engine: ThinEngine, isDepthTexture = false) {
        this._engine = engine;
        this._isDepthTexture = isDepthTexture;

        this._renderer = new EffectRenderer(engine);

        this._effectWrapper = new EffectWrapper({
            engine: engine,
            name: "CopyTextureToTexture",
            fragmentShader: "copyTextureToTexture",
            useShaderStore: true,
            uniformNames: ["conversion"],
            samplerNames: ["textureSampler"],
            defines: isDepthTexture ? ["#define DEPTH_TEXTURE"] : [],
        });

        this._effectWrapper.onApplyObservable.add(() => {
            if (isDepthTexture) {
                engine.setState(false);
                engine.setDepthBuffer(true);
                engine.depthCullingState.depthMask = true;
                engine.depthCullingState.depthFunc = Constants.ALWAYS;
            }

            if (this._textureIsInternal(this._source)) {
                this._effectWrapper.effect._bindTexture("textureSampler", this._source);
            } else {
                this._effectWrapper.effect.setTexture("textureSampler", this._source);
            }
            this._effectWrapper.effect.setFloat("conversion", this._conversion);
        });
    }

    /**
     * Indicates if the effect is ready to be used for the copy
     * @returns true if "copy" can be called without delay, else false
     */
    public isReady(): boolean {
        return this._effectWrapper.effect.isReady();
    }

    /**
     * Copy one texture into another
     * @param source The source texture
     * @param destination The destination texture
     * @param conversion The conversion mode that should be applied when copying
     * @returns
     */
    public copy(source: InternalTexture | ThinTexture, destination: RenderTargetWrapper | IRenderTargetTexture, conversion = ConversionMode.None): boolean {
        if (!this.isReady()) {
            return false;
        }

        this._source = source;
        this._conversion = conversion;

        const engineDepthFunc = this._engine.depthCullingState.depthFunc;

        this._renderer.render(this._effectWrapper, destination);

        if (this._isDepthTexture && engineDepthFunc) {
            this._engine.depthCullingState.depthFunc = engineDepthFunc;
        }

        return true;
    }

    /**
     * Releases all the resources used by the class
     */
    public dispose(): void {
        this._effectWrapper.dispose();
        this._renderer.dispose();
    }
}
