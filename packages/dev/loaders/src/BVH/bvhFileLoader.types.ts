export {};

import { type BVHLoadingOptions } from "./bvhLoadingOptions";
import { type BVHFileLoaderMetadata } from "./bvhFileLoader.metadata";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the bvh loader.
         */
        [BVHFileLoaderMetadata.name]: Partial<BVHLoadingOptions>;
    }
}
