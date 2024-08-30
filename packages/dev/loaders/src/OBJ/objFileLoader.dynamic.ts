import type { ISceneLoaderPluginFactory } from "core/Loading/sceneLoader";
import { OBJFileLoaderMetadata } from "./objFileLoader.metadata";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";

/**
 * Registers the OBJ async plugin factory, which dynamically imports and loads the OBJ plugin on demand.
 */
export function registerOBJLoader() {
    registerSceneLoaderPlugin({
        ...OBJFileLoaderMetadata,
        createPlugin: async () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { OBJFileLoader } = await import("./objFileLoader.plugin");
            return new OBJFileLoader();
        },
    } satisfies ISceneLoaderPluginFactory);
}
