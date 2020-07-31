import { TGATools } from "../../../Misc/tga";
import { Nullable } from "../../../types";
import { Engine } from "../../../Engines/engine";
import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../../../Materials/Textures/internalTextureLoader";
import { StringTools } from '../../../Misc/stringTools';

/**
 * Implementation of the TGA Texture Loader.
 * @hidden
 */
export class _TGATextureLoader implements IInternalTextureLoader {
    /**
     * Defines wether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * This returns if the loader support the current file information.
     * @param extension defines the file extension of the file being loaded
     * @returns true if the loader can load the specified file
     */
    public canLoad(extension: string): boolean {
        return StringTools.EndsWith(extension, ".tga");
    }

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    public loadCubeData(data: ArrayBufferView | ArrayBufferView[], texture: InternalTexture, createPolynomials: boolean, onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>): void {
        throw ".env not supported in Cube.";
    }

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(data: ArrayBufferView, texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => void): void {
        var bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

        var header = TGATools.GetTGAHeader(bytes);
        callback(header.width, header.height, texture.generateMipMaps, false, () => {
            TGATools.UploadContent(texture, bytes);
        });
    }
}

// Register the loader.
Engine._TextureLoaders.push(new _TGATextureLoader());
