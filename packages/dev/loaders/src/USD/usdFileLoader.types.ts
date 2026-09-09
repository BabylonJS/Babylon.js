export {};

import { type USDFileLoaderMetadata } from "./usdFileLoader.metadata";
import { type USDFileLoaderOptions } from "./usdLoadingOptions";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the USD loader.
         */
        [USDFileLoaderMetadata.name]: Partial<USDFileLoaderOptions>;
    }
}
