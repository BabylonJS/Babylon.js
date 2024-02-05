import type { Nullable } from "../../types";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Constants } from "../../Engines/constants";

import type { ISize } from "../../Maths/math.size";
import { Size } from "../../Maths/math.size";

import type { ThinEngine } from "../../Engines/thinEngine";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";

/**
 * Base class of all the textures in babylon.
 * It groups all the common properties required to work with Thin Engine.
 */
export class ThinTexture {
    protected _wrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    public get wrapU() {
        return this._wrapU;
    }

    public set wrapU(value: number) {
        this._wrapU = value;
    }

    protected _wrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;
    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    public get wrapV() {
        return this._wrapV;
    }

    public set wrapV(value: number) {
        this._wrapV = value;
    }

    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    public wrapR = Constants.TEXTURE_WRAP_ADDRESSMODE;

    /**
     * With compliant hardware and browser (supporting anisotropic filtering)
     * this defines the level of anisotropic filtering in the texture.
     * The higher the better but the slower. This defaults to 4 as it seems to be the best tradeoff.
     */
    public anisotropicFilteringLevel = 4;

    /**
     * Define the current state of the loading sequence when in delayed load mode.
     */
    public delayLoadState = Constants.DELAYLOADSTATE_NONE;

    /**
     * How a texture is mapped.
     * Unused in thin texture mode.
     */
    public get coordinatesMode(): number {
        return 0;
    }

    /**
     * Define if the texture is a cube texture or if false a 2d texture.
     */
    public get isCube(): boolean {
        if (!this._texture) {
            return false;
        }

        return this._texture.isCube;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected set isCube(value: boolean) {
        if (!this._texture) {
            return;
        }

        this._texture.isCube = value;
    }

    /**
     * Define if the texture is a 3d texture (webgl 2) or if false a 2d texture.
     */
    public get is3D(): boolean {
        if (!this._texture) {
            return false;
        }

        return this._texture.is3D;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected set is3D(value: boolean) {
        if (!this._texture) {
            return;
        }

        this._texture.is3D = value;
    }

    /**
     * Define if the texture is a 2d array texture (webgl 2) or if false a 2d texture.
     */
    public get is2DArray(): boolean {
        if (!this._texture) {
            return false;
        }

        return this._texture.is2DArray;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected set is2DArray(value: boolean) {
        if (!this._texture) {
            return;
        }

        this._texture.is2DArray = value;
    }

    /**
     * Get the class name of the texture.
     * @returns "ThinTexture"
     */
    public getClassName(): string {
        return "ThinTexture";
    }

    /** @internal */
    public _texture: Nullable<InternalTexture> = null;

    protected _engine: Nullable<ThinEngine> = null;

    private _cachedSize: ISize = Size.Zero();
    private _cachedBaseSize: ISize = Size.Zero();

    private static _IsRenderTargetWrapper(texture: Nullable<InternalTexture> | Nullable<RenderTargetWrapper>): texture is RenderTargetWrapper {
        return (texture as RenderTargetWrapper)?._shareDepth !== undefined;
    }

    /**
     * Instantiates a new ThinTexture.
     * Base class of all the textures in babylon.
     * This can be used as an internal texture wrapper in ThinEngine to benefit from the cache
     * @param internalTexture Define the internalTexture to wrap. You can also pass a RenderTargetWrapper, in which case the texture will be the render target's texture
     */
    constructor(internalTexture: Nullable<InternalTexture | RenderTargetWrapper>) {
        this._texture = ThinTexture._IsRenderTargetWrapper(internalTexture) ? internalTexture.texture : internalTexture;
        if (this._texture) {
            this._engine = this._texture.getEngine();
        }
    }

    /**
     * Get if the texture is ready to be used (downloaded, converted, mip mapped...).
     * @returns true if fully ready
     */
    public isReady(): boolean {
        if (this.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) {
            this.delayLoad();
            return false;
        }

        if (this._texture) {
            return this._texture.isReady;
        }

        return false;
    }

    /**
     * Triggers the load sequence in delayed load mode.
     */
    public delayLoad(): void {}

    /**
     * Get the underlying lower level texture from Babylon.
     * @returns the internal texture
     */
    public getInternalTexture(): Nullable<InternalTexture> {
        return this._texture;
    }

    /**
     * Get the size of the texture.
     * @returns the texture size.
     */
    public getSize(): ISize {
        if (this._texture) {
            if (this._texture.width) {
                this._cachedSize.width = this._texture.width;
                this._cachedSize.height = this._texture.height;
                return this._cachedSize;
            }

            if (this._texture._size) {
                this._cachedSize.width = this._texture._size;
                this._cachedSize.height = this._texture._size;
                return this._cachedSize;
            }
        }

        return this._cachedSize;
    }

    /**
     * Get the base size of the texture.
     * It can be different from the size if the texture has been resized for POT for instance
     * @returns the base size
     */
    public getBaseSize(): ISize {
        if (!this.isReady() || !this._texture) {
            this._cachedBaseSize.width = 0;
            this._cachedBaseSize.height = 0;
            return this._cachedBaseSize;
        }

        if (this._texture._size) {
            this._cachedBaseSize.width = this._texture._size;
            this._cachedBaseSize.height = this._texture._size;
            return this._cachedBaseSize;
        }

        this._cachedBaseSize.width = this._texture.baseWidth;
        this._cachedBaseSize.height = this._texture.baseHeight;
        return this._cachedBaseSize;
    }

    /** @internal */
    protected _initialSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * Get the current sampling mode associated with the texture.
     */
    public get samplingMode(): number {
        if (!this._texture) {
            return this._initialSamplingMode;
        }

        return this._texture.samplingMode;
    }

    /**
     * Update the sampling mode of the texture.
     * Default is Trilinear mode.
     *
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 1     | NEAREST_SAMPLINGMODE or NEAREST_NEAREST_MIPLINEAR  | Nearest is: mag = nearest, min = nearest, mip = linear |
     * | 2     | BILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPNEAREST | Bilinear is: mag = linear, min = linear, mip = nearest |
     * | 3     | TRILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPLINEAR | Trilinear is: mag = linear, min = linear, mip = linear |
     * | 4     | NEAREST_NEAREST_MIPNEAREST |             |
     * | 5    | NEAREST_LINEAR_MIPNEAREST |             |
     * | 6    | NEAREST_LINEAR_MIPLINEAR |             |
     * | 7    | NEAREST_LINEAR |             |
     * | 8    | NEAREST_NEAREST |             |
     * | 9   | LINEAR_NEAREST_MIPNEAREST |             |
     * | 10   | LINEAR_NEAREST_MIPLINEAR |             |
     * | 11   | LINEAR_LINEAR |             |
     * | 12   | LINEAR_NEAREST |             |
     *
     *    > _mag_: magnification filter (close to the viewer)
     *    > _min_: minification filter (far from the viewer)
     *    > _mip_: filter used between mip map levels
     *@param samplingMode Define the new sampling mode of the texture
     */
    public updateSamplingMode(samplingMode: number): void {
        if (this._texture && this._engine) {
            this._engine.updateTextureSamplingMode(samplingMode, this._texture);
        }
    }

    /**
     * Release and destroy the underlying lower level texture aka internalTexture.
     */
    public releaseInternalTexture(): void {
        if (this._texture) {
            this._texture.dispose();
            this._texture = null;
        }
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        if (this._texture) {
            this.releaseInternalTexture();
            this._engine = null;
        }
    }
}
