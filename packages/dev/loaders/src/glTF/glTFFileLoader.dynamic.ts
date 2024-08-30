import type { ISceneLoaderPluginFactory, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { GLTFFileLoaderMetadata } from "./glTFFileLoader.metadata";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";
import { registerBuiltInGLTFExtensions } from "./2.0/Extensions/dynamic";

/**
 * Registers the GLTF async plugin factory, which dynamically imports and loads the GLTF plugin on demand.
 */
export function registerGLTFLoader() {
    // Register the GLTF loader (2.0) specifically/only.
    registerSceneLoaderPlugin({
        ...GLTFFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { GLTFFileLoader } = await import("./2.0/glTFLoader");
            return new GLTFFileLoader(options[GLTFFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the built-in GLTF extensions.
    // NOTE: This does mean that all the built-in extensions would be included in the bundle or bundle chunks.
    //       In the case of bundle chunks, they would only be downloaded when the extension is used.
    //       Most likely the common use case will be to want to include the built-in extensions, so we're optimizing for that.
    //       If someone really doesn't want them, they can always dup this very simple factory and exclude the extensions.
    registerBuiltInGLTFExtensions();
}
