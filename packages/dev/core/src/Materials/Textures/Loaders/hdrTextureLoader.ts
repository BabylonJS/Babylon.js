import { RGBE_ReadHeader, RGBE_ReadPixels } from "../../../Misc/HighDynamicRange/hdr";
import type { InternalTexture } from "../../../Materials/Textures/internalTexture";
import type { IInternalTextureLoader } from "./internalTextureLoader";
import { Constants } from "../../../Engines/constants";

/**
 * Implementation of the HDR Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _HDRTextureLoader implements IInternalTextureLoader {
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
        const uint8array = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        const hdrInfo = RGBE_ReadHeader(uint8array);
        const pixelsDataRGB32 = RGBE_ReadPixels(uint8array, hdrInfo);

        const pixels = hdrInfo.width * hdrInfo.height;
        const pixelsDataRGBA32 = new Float32Array(pixels * 4);
        for (let i = 0; i < pixels; i += 1) {
            pixelsDataRGBA32[i * 4] = pixelsDataRGB32[i * 3];
            pixelsDataRGBA32[i * 4 + 1] = pixelsDataRGB32[i * 3 + 1];
            pixelsDataRGBA32[i * 4 + 2] = pixelsDataRGB32[i * 3 + 2];
            pixelsDataRGBA32[i * 4 + 3] = 1;
        }

        callback(hdrInfo.width, hdrInfo.height, texture.generateMipMaps, false, () => {
            const engine = texture.getEngine();
            texture.type = Constants.TEXTURETYPE_FLOAT;
            texture.format = Constants.TEXTUREFORMAT_RGBA;
            texture._gammaSpace = false;
            engine._uploadDataToTextureDirectly(texture, pixelsDataRGBA32);
        });
    }
}
