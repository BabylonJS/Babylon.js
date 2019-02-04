import { KhronosTextureContainer } from "../../../Misc/khronosTextureContainer";
import { Nullable } from "../../../types";
import { Engine } from "../../../Engines/engine";
import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../../../Materials/Textures/internalTextureLoader";
import { _TimeToken } from "../../../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../../../States/index";
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
     * @param textureFormatInUse defines the current compressed format in use iun the engine
     * @param fallback defines the fallback internal texture if any
     * @param isBase64 defines whether the texture is encoded as a base64
     * @param isBuffer defines whether the texture data are stored as a buffer
     * @returns true if the loader can load the specified file
     */
    public canLoad(extension: string, textureFormatInUse: Nullable<string>, fallback: Nullable<InternalTexture>, isBase64: boolean, isBuffer: boolean): boolean {
        if (textureFormatInUse && !isBase64 && !fallback && !isBuffer) {
            return true;
        }
        return false;
    }

    /**
     * Transform the url before loading if required.
     * @param rootUrl the url of the texture
     * @param textureFormatInUse defines the current compressed format in use iun the engine
     * @returns the transformed texture
     */
    public transformUrl(rootUrl: string, textureFormatInUse: Nullable<string>): string {
        var lastDot = rootUrl.lastIndexOf('.');
        if (lastDot != -1 && rootUrl.substring(lastDot + 1) == "ktx") {
            // Already transformed
            return rootUrl;
        }
        return (lastDot > -1 ? rootUrl.substring(0, lastDot) : rootUrl) + textureFormatInUse;
    }

    /**
     * Gets the fallback url in case the load fail. This can return null to allow the default fallback mecanism to work
     * @param rootUrl the url of the texture
     * @param textureFormatInUse defines the current compressed format in use iun the engine
     * @returns the fallback texture
     */
    public getFallbackTextureUrl(rootUrl: string, textureFormatInUse: Nullable<string>): Nullable<string> {
        // remove the format appended to the rootUrl in the original createCubeTexture call.
        var exp = new RegExp("" + textureFormatInUse! + "$");
        return rootUrl.replace(exp, "");
    }

    /**
     * Uploads the cube texture data to the WebGl Texture. It has alreday been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    public loadCubeData(data: string | ArrayBuffer | (string | ArrayBuffer)[], texture: InternalTexture, createPolynomials: boolean, onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>): void {
        if (Array.isArray(data)) {
            return;
        }

        // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
        texture._invertVScale = !texture.invertY;
        var engine = texture.getEngine();
        var ktx = new KhronosTextureContainer(data, 6);

        var loadMipmap = ktx.numberOfMipmapLevels > 1 && texture.generateMipMaps;

        engine._unpackFlipY(true);

        ktx.uploadLevels(texture, texture.generateMipMaps);

        texture.width = ktx.pixelWidth;
        texture.height = ktx.pixelHeight;

        engine._setCubeMapTextureParams(loadMipmap);
        texture.isReady = true;
    }

    /**
     * Uploads the 2D texture data to the WebGl Texture. It has alreday been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(data: ArrayBuffer, texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed: boolean) => void): void {
        // Need to invert vScale as invertY via UNPACK_FLIP_Y_WEBGL is not supported by compressed texture
        texture._invertVScale = !texture.invertY;
        var ktx = new KhronosTextureContainer(data, 1);

        callback(ktx.pixelWidth, ktx.pixelHeight, false, true, () => {
            ktx.uploadLevels(texture, texture.generateMipMaps);
        }, ktx.isInvalid);
    }
}

// Register the loader.
Engine._TextureLoaders.unshift(new _KTXTextureLoader());
