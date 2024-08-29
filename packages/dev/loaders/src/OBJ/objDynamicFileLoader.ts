import type { ISceneLoaderPluginFactory } from "core/Loading/sceneLoader";
import type { OBJFileLoader } from "./objFileLoader.plugin";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";

/**
 * Registers the OBJ async plugin factory, which dynamically imports and loads the OBJ plugin on demand.
 */
export function registerOBJLoader() {
    registerSceneLoaderPlugin({
        name: "obj" satisfies OBJFileLoader["name"],
        extensions: ".obj" satisfies OBJFileLoader["extensions"],
        canDirectLoad: () => false,
        createPlugin: async () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { OBJFileLoader } = await import("./objFileLoader.plugin");
            return new OBJFileLoader();
        },
    } satisfies ISceneLoaderPluginFactory);
}
