import { type InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type Scene } from "../../../scene";
import { type Nullable } from "../../../types";
/* eslint-disable @typescript-eslint/no-unused-vars */

declare module "../../../Engines/thinNativeEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ThinNativeEngine {
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
            noMipmap?: boolean,
            onLoad?: Nullable<(data?: any) => void>,
            onError?: Nullable<(message?: string, exception?: any) => void>,
            format?: number,
            forcedExtension?: any,
            createPolynomials?: boolean,
            lodScale?: number,
            lodOffset?: number,
            fallback?: Nullable<InternalTexture>,
            loaderOptions?: any,
            useSRGBBuffer?: boolean,
            buffer?: Nullable<ArrayBufferView>
        ): InternalTexture;
    }
}
