import type { InternalTexture } from "../internalTexture";
import type { IInternalTextureLoader } from "./internalTextureLoader";
import { Constants } from "../../../Engines/constants";
import { LoadIESData } from "core/Lights/IES/iesLoader";

/**
 * Implementation of the IES Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _IESTextureLoader implements IInternalTextureLoader {
    /**
     * Defines whether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     */
    public loadCubeData(): void {
        // eslint-disable-next-line no-throw-literal
        throw ".ies not supported in Cube.";
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

        const textureData = LoadIESData(uint8array);

        callback(textureData.width, textureData.height, texture.useMipMaps, false, () => {
            const engine = texture.getEngine();
            texture.type = Constants.TEXTURETYPE_FLOAT;
            texture.format = Constants.TEXTUREFORMAT_R;
            texture._gammaSpace = false;
            engine._uploadDataToTextureDirectly(texture, textureData.data);
        });
    }
}
