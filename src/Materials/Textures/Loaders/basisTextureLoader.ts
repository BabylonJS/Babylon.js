import { Nullable } from "../../../types";
import { Engine } from "../../../Engines/engine";
import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../../../Materials/Textures/internalTextureLoader";
import { BasisTools } from "../../../Misc/basis";
import { Tools } from '../../../Misc/tools';
import { StringTools } from '../../../Misc/stringTools';

/**
 * Loader for .basis file format
 */
export class _BasisTextureLoader implements IInternalTextureLoader {
    /**
     * Defines whether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * This returns if the loader support the current file information.
     * @param extension defines the file extension of the file being loaded
     * @returns true if the loader can load the specified file
     */
    public canLoad(extension: string): boolean {
        return StringTools.EndsWith(extension, ".basis");
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
        var caps = texture.getEngine().getCaps();
        var transcodeConfig = {
            supportedCompressionFormats: {
                etc1: caps.etc1 ? true : false,
                s3tc: caps.s3tc ? true : false,
                pvrtc: caps.pvrtc ? true : false,
                etc2: caps.etc2 ? true : false
            }
        };
        BasisTools.TranscodeAsync(data, transcodeConfig).then((result) => {
            var hasMipmap = result.fileInfo.images[0].levels.length > 1 && texture.generateMipMaps;
            BasisTools.LoadTextureFromTranscodeResult(texture, result);
            (texture.getEngine() as Engine)._setCubeMapTextureParams(hasMipmap);
            texture.isReady = true;
            texture.onLoadedObservable.notifyObservers(texture);
            texture.onLoadedObservable.clear();
            if (onLoad) {
              onLoad();
            }
        }).catch((err) => {
            Tools.Warn("Failed to transcode Basis file, transcoding may not be supported on this device");
            texture.isReady = true;
        });
    }

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(data: ArrayBufferView, texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => void): void {
        var caps = texture.getEngine().getCaps();
        var transcodeConfig = {
            supportedCompressionFormats: {
                etc1: caps.etc1 ? true : false,
                s3tc: caps.s3tc ? true : false,
                pvrtc: caps.pvrtc ? true : false,
                etc2: caps.etc2 ? true : false
            }
        };
        BasisTools.TranscodeAsync(data, transcodeConfig).then((result) => {
            var rootImage = result.fileInfo.images[0].levels[0];
            var hasMipmap = result.fileInfo.images[0].levels.length > 1 && texture.generateMipMaps;
            callback(rootImage.width, rootImage.height, hasMipmap, result.format !== -1, () => {
                BasisTools.LoadTextureFromTranscodeResult(texture, result);
            });
        }).catch((err) => {
            Tools.Warn("Failed to transcode Basis file, transcoding may not be supported on this device");
            callback(0, 0, false, false, () => {
            });
        });
    }
}

// Register the loader.
Engine._TextureLoaders.push(new _BasisTextureLoader());
