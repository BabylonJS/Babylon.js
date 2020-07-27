import { Nullable } from "../../../types";
import { SphericalPolynomial } from "../../../Maths/sphericalPolynomial";
import { Engine } from "../../../Engines/engine";
import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../../../Materials/Textures/internalTextureLoader";
import { DDSTools, DDSInfo } from "../../../Misc/dds";
import { StringTools } from '../../../Misc/stringTools';
/**
 * Implementation of the DDS Texture Loader.
 * @hidden
 */
export class _DDSTextureLoader implements IInternalTextureLoader {
    /**
     * Defines wether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = true;

    /**
     * This returns if the loader support the current file information.
     * @param extension defines the file extension of the file being loaded
     * @returns true if the loader can load the specified file
     */
    public canLoad(extension: string): boolean {
        return StringTools.EndsWith(extension, ".dds");
    }

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    public loadCubeData(imgs: ArrayBufferView | ArrayBufferView[], texture: InternalTexture, createPolynomials: boolean, onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>): void {
        var engine = texture.getEngine() as Engine;
        var info: DDSInfo | undefined;
        var loadMipmap: boolean = false;
        if (Array.isArray(imgs)) {
            for (let index = 0; index < imgs.length; index++) {
                let data = imgs[index];
                info = DDSTools.GetDDSInfo(data);

                texture.width = info.width;
                texture.height = info.height;

                loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps;

                engine._unpackFlipY(info.isCompressed);

                DDSTools.UploadDDSLevels(engine, texture, data, info, loadMipmap, 6, -1, index);

                if (!info.isFourCC && info.mipmapCount === 1) {
                    engine.generateMipMapsForCubemap(texture);
                }
            }
        }
        else {
            var data = imgs;
            info = DDSTools.GetDDSInfo(data);

            texture.width = info.width;
            texture.height = info.height;

            if (createPolynomials) {
                info.sphericalPolynomial = new SphericalPolynomial();
            }

            loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps;
            engine._unpackFlipY(info.isCompressed);

            DDSTools.UploadDDSLevels(engine, texture, data, info, loadMipmap, 6);

            if (!info.isFourCC && info.mipmapCount === 1) {
                // Do not unbind as we still need to set the parameters.
                engine.generateMipMapsForCubemap(texture, false);
            }
        }
        engine._setCubeMapTextureParams(loadMipmap);
        texture.isReady = true;
        texture.onLoadedObservable.notifyObservers(texture);
        texture.onLoadedObservable.clear();

        if (onLoad) {
            onLoad({ isDDS: true, width: texture.width, info, data: imgs, texture });
        }
    }

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(data: ArrayBufferView, texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => void): void {
        var info = DDSTools.GetDDSInfo(data);

        var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps && ((info.width >> (info.mipmapCount - 1)) === 1);
        callback(info.width, info.height, loadMipmap, info.isFourCC, () => {
            DDSTools.UploadDDSLevels(texture.getEngine(), texture, data, info, loadMipmap, 1);
        });
    }
}

// Register the loader.
Engine._TextureLoaders.push(new _DDSTextureLoader());
