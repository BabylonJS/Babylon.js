import type { ISceneLoaderPluginFactory } from "core/Loading/sceneLoader";
import { SPLATFileLoaderMetadata } from "./splatFileLoader.metadata";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";

/**
 * Registers the SPLAT async plugin factory, which dynamically imports and loads the SPLAT plugin on demand.
 */
export function registerSPLATLoader() {
    registerSceneLoaderPlugin({
        name: SPLATFileLoaderMetadata.Name,
        extensions: SPLATFileLoaderMetadata.Extensions,
        createPlugin: async () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { SPLATFileLoader } = await import("./splatFileLoader.plugin");
            return new SPLATFileLoader();
        },
    } satisfies ISceneLoaderPluginFactory);
}
