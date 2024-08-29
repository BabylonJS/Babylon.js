import type { ISceneLoaderPluginFactory } from "core/Loading/sceneLoader";
import { STLFileLoaderMetadata } from "./stlFileLoaderMetadata";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";

/**
 * Registers the STL async plugin factory, which dynamically imports and loads the STL plugin on demand.
 */
export function registerSTLLoader() {
    registerSceneLoaderPlugin({
        name: STLFileLoaderMetadata.Name,
        extensions: STLFileLoaderMetadata.Extensions,
        createPlugin: async () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { STLFileLoader } = await import("./stlFileLoader.plugin");
            return new STLFileLoader();
        },
    } satisfies ISceneLoaderPluginFactory);
}
