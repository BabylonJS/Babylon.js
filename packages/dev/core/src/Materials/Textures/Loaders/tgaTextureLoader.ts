import { GetTGAHeader, UploadContent } from "../../../Misc/tga";
import type { InternalTexture } from "../../../Materials/Textures/internalTexture";
import type { IInternalTextureLoader } from "./internalTextureLoader";

/**
 * Implementation of the TGA Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _TGATextureLoader implements IInternalTextureLoader {
    /**
     * Defines whether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     */
    public loadCubeData(): void {
        // eslint-disable-next-line no-throw-literal
        throw ".env not supported in Cube.";
    }

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(
        data: ArrayBufferView,
        texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => void
    ): void {
        const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

        const header = GetTGAHeader(bytes);
        callback(header.width, header.height, texture.generateMipMaps, false, () => {
            UploadContent(texture, bytes);
        });
    }
}
