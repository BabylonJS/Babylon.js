import { KhronosTextureContainer } from "../../../Misc/khronosTextureContainer";
import { KhronosTextureContainer2 } from "../../../Misc/khronosTextureContainer2";
import type { Nullable } from "../../../types";
import type { InternalTexture } from "../../../Materials/Textures/internalTexture";
import type { IInternalTextureLoader } from "./internalTextureLoader";
import { Logger } from "../../../Misc/logger";
import { Constants } from "../../../Engines/constants";

function mapSRGBToLinear(format: number): Nullable<number> {
    switch (format) {
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_S3TC_DXT1_EXT:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ETC2:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_BPTC_UNORM:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM;
    }

    return null;
}

/**
 * Implementation of the KTX Texture Loader.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _KTXTextureLoader implements IInternalTextureLoader {
    /**
     * Defines whether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     */
    public loadCubeData(data: ArrayBufferView | ArrayBufferView[], texture: InternalTexture, createPolynomials: boolean, onLoad: Nullable<(data?: any) => void>): void {
        if (Array.isArray(data)) {
            return;
        }

        // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
        texture._invertVScale = !texture.invertY;
        const engine = texture.getEngine();
        const ktx = new KhronosTextureContainer(data, 6);

        const loadMipmap = ktx.numberOfMipmapLevels > 1 && texture.generateMipMaps;

        engine._unpackFlipY(true);

        ktx.uploadLevels(texture, texture.generateMipMaps);

        texture.width = ktx.pixelWidth;
        texture.height = ktx.pixelHeight;

        engine._setCubeMapTextureParams(texture, loadMipmap, ktx.numberOfMipmapLevels - 1);
        texture.isReady = true;
        texture.onLoadedObservable.notifyObservers(texture);
        texture.onLoadedObservable.clear();

        if (onLoad) {
            onLoad();
        }
    }

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     * @param options
     */
    public loadData(
        data: ArrayBufferView,
        texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed: boolean) => void,
        options?: any
    ): void {
        if (KhronosTextureContainer.IsValid(data)) {
            // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
            texture._invertVScale = !texture.invertY;
            const ktx = new KhronosTextureContainer(data, 1);

            const mappedFormat = mapSRGBToLinear(ktx.glInternalFormat);
            if (mappedFormat) {
                texture.format = mappedFormat;
                texture._useSRGBBuffer = texture.getEngine()._getUseSRGBBuffer(true, texture.generateMipMaps);
                texture._gammaSpace = true;
            } else {
                texture.format = ktx.glInternalFormat;
            }

            callback(
                ktx.pixelWidth,
                ktx.pixelHeight,
                texture.generateMipMaps,
                true,
                () => {
                    ktx.uploadLevels(texture, texture.generateMipMaps);
                },
                ktx.isInvalid
            );
        } else if (KhronosTextureContainer2.IsValid(data)) {
            const ktx2 = new KhronosTextureContainer2(texture.getEngine());
            ktx2._uploadAsync(data, texture, options).then(
                () => {
                    callback(texture.width, texture.height, texture.generateMipMaps, true, () => {}, false);
                },
                (error) => {
                    Logger.Warn(`Failed to load KTX2 texture data: ${error.message}`);
                    callback(0, 0, false, false, () => {}, true);
                }
            );
        } else {
            Logger.Error("texture missing KTX identifier");
            callback(0, 0, false, false, () => {}, true);
        }
    }
}
