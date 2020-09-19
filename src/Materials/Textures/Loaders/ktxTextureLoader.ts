import { KhronosTextureContainer } from "../../../Misc/khronosTextureContainer";
import { KhronosTextureContainer2 } from "../../../Misc/khronosTextureContainer2";
import { Nullable } from "../../../types";
import { Engine } from "../../../Engines/engine";
import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../../../Materials/Textures/internalTextureLoader";
import { StringTools } from '../../../Misc/stringTools';
import { Logger } from '../../../Misc/logger';

/**
 * Implementation of the KTX Texture Loader.
 * @hidden
 */
export class _KTXTextureLoader implements IInternalTextureLoader {
    /**
     * Defines wether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * This returns if the loader support the current file information.
     * @param extension defines the file extension of the file being loaded
     * @param mimeType defines the optional mime type of the file being loaded
     * @returns true if the loader can load the specified file
     */
    public canLoad(extension: string, mimeType?: string): boolean {
        // The ".ktx2" file extension is still up for debate: https://github.com/KhronosGroup/KTX-Specification/issues/18
        return StringTools.EndsWith(extension, ".ktx") || StringTools.EndsWith(extension, ".ktx2") || mimeType === "image/ktx" || mimeType === "image/ktx2";
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
        if (Array.isArray(data)) {
            return;
        }

        // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
        texture._invertVScale = !texture.invertY;
        var engine = texture.getEngine() as Engine;
        var ktx = new KhronosTextureContainer(data, 6);

        var loadMipmap = ktx.numberOfMipmapLevels > 1 && texture.generateMipMaps;

        engine._unpackFlipY(true);

        ktx.uploadLevels(texture, texture.generateMipMaps);

        texture.width = ktx.pixelWidth;
        texture.height = ktx.pixelHeight;

        engine._setCubeMapTextureParams(loadMipmap);
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
     */
    public loadData(data: ArrayBufferView, texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed: boolean) => void): void {
        if (KhronosTextureContainer.IsValid(data)) {
            // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
            texture._invertVScale = !texture.invertY;
            const ktx = new KhronosTextureContainer(data, 1);
            callback(ktx.pixelWidth, ktx.pixelHeight, texture.generateMipMaps, true, () => {
                ktx.uploadLevels(texture, texture.generateMipMaps);
            }, ktx.isInvalid);
        }
        else if (KhronosTextureContainer2.IsValid(data)) {
            const ktx2 = new KhronosTextureContainer2(texture.getEngine());
            ktx2.uploadAsync(data, texture).then(() => {
                callback(texture.width, texture.height, texture.generateMipMaps, true, () => {}, false);
            }, (error) => {
                Logger.Warn(`Failed to load KTX2 texture data: ${error.message}`);
                callback(0, 0, false, false, () => {}, true);
            });
        }
        else {
            Logger.Error("texture missing KTX identifier");
            callback(0, 0, false, false, () => {}, true);
        }
    }
}

// Register the loader.
Engine._TextureLoaders.unshift(new _KTXTextureLoader());
