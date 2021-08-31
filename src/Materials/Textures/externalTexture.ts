import { Constants } from "../../Engines/constants";
import { InternalTexture } from "./internalTexture";

/**
 * Class used to store an external texture (like GPUExternalTexture in WebGPU)
 */
 export class ExternalTexture {
    public static IsExternalTexture(texture: ExternalTexture | InternalTexture): texture is ExternalTexture {
        return (texture as ExternalTexture).underlyingResource !== undefined;
    }

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