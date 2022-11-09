import type { Engine } from "../Engines/engine";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../Engines/renderTargetWrapper";
import type { ThinTexture } from "../Materials/Textures/thinTexture";

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
     */
    constructor(engine: Engine) {
        this._renderer = new EffectRenderer(engine);
        this._effectWrapper = new EffectWrapper({
            engine: engine,
            name: "CopyTextureToTexture",
            fragmentShader: "copyTextureToTexture",
            useShaderStore: true,
            uniformNames: ["conversion"],
            samplerNames: ["textureSampler"],
        });

        this._effectWrapper.onApplyObservable.add(() => {
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

        this._renderer.render(this._effectWrapper, destination);

        return true;
    }
}
