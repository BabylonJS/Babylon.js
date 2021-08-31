import { Constants } from "../../Engines/constants";
import { InternalTexture } from "./internalTexture";

/**
 * Class used to store an external texture (like GPUExternalTexture in WebGPU)
 */
 export class ExternalTexture {
    public static IsExternalTexture(texture: ExternalTexture | InternalTexture): texture is ExternalTexture {
        return (texture as ExternalTexture).underlyingResource !== undefined;
    }

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

    protected _samplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
    /**
     * Get the current sampling mode associated with the texture.
     */
    public get samplingMode(): number {
        return this._samplingMode;
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
     * @param samplingMode Define the new sampling mode of the texture
     */
    public updateSamplingMode(samplingMode: number): void {
         this._samplingMode = samplingMode;
    }

    /**
     * With compliant hardware and browser (supporting anisotropic filtering)
     * this defines the level of anisotropic filtering in the texture.
     */
    public anisotropicFilteringLevel = 1;

    /**
     * Get the class name of the texture.
     * @returns "ExternalTexture"
     */
    public getClassName(): string {
        return "ExternalTexture";
    }

    /**
     * Gets the underlying texture object
     */
    public get underlyingResource(): any {
        return null;
    }

    /**
     * The type of the underlying texture is implementation dependent, so return "UNDEFINED" for the type
     */
    public readonly type = Constants.TEXTURETYPE_UNDEFINED;

    /**
     * Gets the unique id of this texture
     */
    public readonly uniqueId: number;

    /**
     * Constructs the texture
     */
    constructor() {
        this.uniqueId = InternalTexture._Counter++;
    }

    /**
     * Get if the texture is ready to be used (downloaded, converted, mip mapped...).
     * @returns true if fully ready
     */
    public isReady(): boolean {
        return true;
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
    }
}