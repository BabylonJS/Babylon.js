export {};

import { type FBXFileLoaderMetadata } from "./fbxFileLoader.metadata";
import { type FBXFileLoaderOptions } from "./fbxFileLoader.pure";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the FBX loader.
         */
        [FBXFileLoaderMetadata.name]: Partial<FBXFileLoaderOptions>;
    }
}
