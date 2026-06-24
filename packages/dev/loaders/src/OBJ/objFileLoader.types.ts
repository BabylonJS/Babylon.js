export {};

import { type OBJFileLoaderMetadata } from "./objFileLoader.metadata";
import { type OBJLoadingOptions } from "./objLoadingOptions";

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the obj loader.
         */
        [OBJFileLoaderMetadata.name]: Partial<OBJLoadingOptions>;
    }
}
