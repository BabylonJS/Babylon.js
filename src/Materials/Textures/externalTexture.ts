import { Constants } from "../../Engines/constants";
import { InternalTexture } from "./internalTexture";

/**
 * Class used to store an external texture (like GPUExternalTexture in WebGPU)
 */
 export class ExternalTexture {
     /**
      * Checks if a texture is an external or internal texture
      * @param texture the external or internal texture
      * @returns true if the texture is an external texture, else false
      */
    public static IsExternalTexture(texture: ExternalTexture | InternalTexture): texture is ExternalTexture {
        return (texture as ExternalTexture).underlyingResource !== undefined;
    }

    private _video: HTMLVideoElement;

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
        return this._video;
    }

    /**
     * Gets a boolean indicating if the texture uses mipmaps
     */
    public useMipMaps: boolean = false;

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
     * @param video The video the texture should be wrapped around
     */
    constructor(video: HTMLVideoElement) {
        this._video = video;
        this.uniqueId = InternalTexture._Counter++;
    }

    /**
     * Get if the texture is ready to be used (downloaded, converted, mip mapped...).
     * @returns true if fully ready
     */
    public isReady(): boolean {
        return this._video.readyState >= this._video.HAVE_CURRENT_DATA;
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
    }
}