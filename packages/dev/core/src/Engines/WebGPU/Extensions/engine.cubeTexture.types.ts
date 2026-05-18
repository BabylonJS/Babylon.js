import { type InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type Nullable } from "../../../types";
import { type DepthTextureCreationOptions } from "../../../Materials/Textures/textureCreationOptions";
import { type Scene } from "../../../scene";
declare module "../../abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * @internal
         */
        _setCubeMapTextureParams(texture: InternalTexture, loadMipmap: boolean, maxLevel?: number): void;

        /**
         * Creates a depth stencil cube texture.
         * This is only available in WebGL 2.
         * @param size The size of face edge in the cube texture.
         * @param options The options defining the cube texture.
         * @returns The cube texture
         */
        _createDepthStencilCubeTexture(size: number, options: DepthTextureCreationOptions): InternalTexture;

        /**
         * Creates a cube texture
         * @param rootUrl defines the url where the files to load is located
         * @param scene defines the current scene
         * @param files defines the list of files to load (1 per face)
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials if a polynomial sphere should be created for the cube texture
         * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
         * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
         * @param fallback defines texture to use while falling back when (compressed) texture file not found.
         * @param loaderOptions options to be passed to the loader
         * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
         * @param buffer defines the data buffer to load instead of loading the rootUrl
         * @returns the cube texture as an InternalTexture
         */
        createCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean | undefined,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any,
            createPolynomials: boolean,
            lodScale: number,
            lodOffset: number,
            fallback: Nullable<InternalTexture>,
            loaderOptions: any,
            useSRGBBuffer: boolean,
            buffer: Nullable<ArrayBufferView>
        ): InternalTexture;

        /**
         * Creates a cube texture
         * @param rootUrl defines the url where the files to load is located
         * @param scene defines the current scene
         * @param files defines the list of files to load (1 per face)
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @returns the cube texture as an InternalTexture
         */
        createCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any
        ): InternalTexture;

        /**
         * Creates a cube texture
         * @param rootUrl defines the url where the files to load is located
         * @param scene defines the current scene
         * @param files defines the list of files to load (1 per face)
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials if a polynomial sphere should be created for the cube texture
         * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
         * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
         * @returns the cube texture as an InternalTexture
         */
        createCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any,
            createPolynomials: boolean,
            lodScale: number,
            lodOffset: number
        ): InternalTexture;

        /** @internal */
        createCubeTextureBase(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any,
            createPolynomials: boolean,
            lodScale: number,
            lodOffset: number,
            fallback: Nullable<InternalTexture>,
            beforeLoadCubeDataCallback: Nullable<(texture: InternalTexture, data: ArrayBufferView | ArrayBufferView[]) => void>,
            imageHandler: Nullable<(texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => void>,
            useSRGBBuffer: boolean,
            buffer: Nullable<ArrayBufferView>
        ): InternalTexture;

        /** @internal */
        _partialLoadFile(
            url: string,
            index: number,
            loadedFiles: ArrayBuffer[],
            onfinish: (files: ArrayBuffer[]) => void,
            onErrorCallBack: Nullable<(message?: string, exception?: any) => void>
        ): void;

        /** @internal */
        _cascadeLoadFiles(scene: Nullable<Scene>, onfinish: (images: ArrayBuffer[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void>): void;

        /** @internal */
        _cascadeLoadImgs(
            scene: Nullable<Scene>,
            texture: InternalTexture,
            onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
            files: string[],
            onError: Nullable<(message?: string, exception?: any) => void>,
            mimeType?: string
        ): void;

        /** @internal */
        _partialLoadImg(
            url: string,
            index: number,
            loadedImages: HTMLImageElement[] | ImageBitmap[],
            scene: Nullable<Scene>,
            texture: InternalTexture,
            onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
            onErrorCallBack: Nullable<(message?: string, exception?: any) => void>,
            mimeType?: string
        ): void;

        /**
         * Force the mipmap generation for the given render target texture
         * @param texture defines the render target texture to use
         * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
         */
        generateMipMapsForCubemap(texture: InternalTexture, unbind?: boolean): void;
    }
}
