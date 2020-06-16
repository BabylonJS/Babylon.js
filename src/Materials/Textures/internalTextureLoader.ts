import { Nullable } from "../../types";
import { InternalTexture } from "../../Materials/Textures/internalTexture";

/**
 * This represents the required contract to create a new type of texture loader.
 */
export interface IInternalTextureLoader {
    /**
     * Defines wether the loader supports cascade loading the different faces.
     */
    supportCascades: boolean;

    /**
     * This returns if the loader support the current file information.
     * @param extension defines the file extension of the file being loaded
     * @param mimeType defines the optional mime type of the file being loaded
     * @returns true if the loader can load the specified file
     */
    canLoad(extension: string, mimetype?: string): boolean;

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    loadCubeData(data: ArrayBufferView | ArrayBufferView[], texture: InternalTexture, createPolynomials: boolean, onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>): void;

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    loadData(data: ArrayBufferView, texture: InternalTexture, callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed?: boolean) => void): void;
}
