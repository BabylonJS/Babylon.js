import { Nullable } from "../../../types";
import { Engine } from "../../../Engines/engine";
import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { IInternalTextureLoader } from "../../../Materials/Textures/internalTextureLoader";
import { _TimeToken } from "../../../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../../../States/index";
import { BasisTools } from "../../../Misc/basis";

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
     * @param textureFormatInUse defines the current compressed format in use iun the engine
     * @param fallback defines the fallback internal texture if any
     * @param isBase64 defines whether the texture is encoded as a base64
     * @param isBuffer defines whether the texture data are stored as a buffer
     * @returns true if the loader can load the specified file
     */
    public canLoad(extension: string, textureFormatInUse: Nullable<string>, fallback: Nullable<InternalTexture>, isBase64: boolean, isBuffer: boolean): boolean {
        return extension.indexOf(".basis") === 0;
    }

    /**
     * Transform the url before loading if required.
     * @param rootUrl the url of the texture
     * @param textureFormatInUse defines the current compressed format in use iun the engine
     * @returns the transformed texture
     */
    public transformUrl(rootUrl: string, textureFormatInUse: Nullable<string>): string {
        return rootUrl;
    }

    /**
     * Gets the fallback url in case the load fail. This can return null to allow the default fallback mecanism to work
     * @param rootUrl the url of the texture
     * @param textureFormatInUse defines the current compressed format in use iun the engine
     * @returns the fallback texture
     */
    public getFallbackTextureUrl(rootUrl: string, textureFormatInUse: Nullable<string>): Nullable<string> {
        return null;
    }

    /**
     * Uploads the cube texture data to the WebGl Texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    public loadCubeData(data: string | ArrayBuffer | (string | ArrayBuffer)[], texture: InternalTexture, createPolynomials: boolean, onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>): void {
        throw ".basis not supported in Cube.";
    }

    /**
     * Uploads the 2D texture data to the WebGl Texture. It has alreday been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(data: ArrayBuffer, texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => void): void {
        // Verify Basis Module is loaded and detect file info and format
        BasisTools.VerifyBasisModuleAsync().then(() => {
            var loadedFile = BasisTools.LoadBasisFile(data);
            var fileInfo = BasisTools.GetFileInfo(loadedFile);
            var format = BasisTools.GetSupportedTranscodeFormat(texture.getEngine(), fileInfo);

            // TODO this should be done in web worker
            var transcodeResult = BasisTools.TranscodeFile(format, fileInfo, loadedFile);

            // Upload data to texture
            callback(fileInfo.width, fileInfo.height, false, true, () => {
                if (transcodeResult.fallbackToRgb565) {
                    texture.type = Engine.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
                    texture.format = Engine.TEXTUREFORMAT_RGB;
                    texture.getEngine()._uploadDataToTextureAndResize(texture, transcodeResult.pixels, fileInfo.alignedWidth, fileInfo.alignedHeight, Engine.TEXTUREFORMAT_RGB);
                }else {
                    // compress texture needs to be flipped
                    texture._invertVScale = true;
                    texture.getEngine()._uploadCompressedDataToTextureDirectly(texture, BasisTools.GetInternalFormatFromBasisFormat(format!), fileInfo.width, fileInfo.height, transcodeResult.pixels, 0, 0);
                }
            });
        });
    }
}

// Register the loader.
Engine._TextureLoaders.push(new _BasisTextureLoader());