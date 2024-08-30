import type { ISceneLoaderPluginFactory, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { GLTFFileLoaderMetadata } from "./glTFFileLoaderMetadata";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";

/**
 * Registers the GLTF async plugin factory, which dynamically imports and loads the GLTF plugin on demand.
 */
export function registerGLTFLoader() {
    registerSceneLoaderPlugin({
        name: GLTFFileLoaderMetadata.Name,
        extensions: GLTFFileLoaderMetadata.Extensions,
        canDirectLoad: GLTFFileLoaderMetadata.CanDirectLoad,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { GLTFFileLoader } = await import("./2.0/glTFLoader");
            return new GLTFFileLoader(options[GLTFFileLoaderMetadata.Name]);
        },
    } satisfies ISceneLoaderPluginFactory);
}
