import { type InternalTexture } from "../../Materials/Textures/internalTexture";
import { type Nullable } from "../../types";
import { type Scene } from "../../scene";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Create a cube texture from prefiltered data (ie. the mipmaps contain ready to use data for PBR reflection)
         * @param rootUrl defines the url where the file to load is located
         * @param scene defines the current scene
         * @param lodScale defines scale to apply to the mip map selection
         * @param lodOffset defines offset to apply to the mip map selection
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials defines wheter or not to create polynomails harmonics for the texture
         * @returns the cube texture as an InternalTexture
         */
        createPrefilteredCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            lodScale: number,
            lodOffset: number,
            onLoad?: Nullable<(internalTexture: Nullable<InternalTexture>) => void>,
            onError?: Nullable<(message?: string, exception?: any) => void>,
            format?: number,
            forcedExtension?: any,
            createPolynomials?: boolean
        ): InternalTexture;
    }
}
