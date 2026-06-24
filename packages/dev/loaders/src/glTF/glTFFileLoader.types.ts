export {};

import { type GLTFFileLoaderMetadata } from "./glTFFileLoader.metadata";
import { type GLTFLoaderOptions } from "./glTFFileLoader.pure";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the glTF loader.
         */
        [GLTFFileLoaderMetadata.name]: Partial<GLTFLoaderOptions>;
    }
}
