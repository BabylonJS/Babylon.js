/* eslint-disable @typescript-eslint/naming-convention */

import type { ISceneLoaderPluginFactory, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { registerSceneLoaderPlugin } from "core/Loading/sceneLoader";

import { GLTFFileLoaderMetadata } from "./glTF/glTFFileLoader.metadata";
import { OBJFileLoaderMetadata } from "./OBJ/objFileLoader.metadata";
import { SPLATFileLoaderMetadata } from "./SPLAT/splatFileLoader.metadata";
import { STLFileLoaderMetadata } from "./STL/stlFileLoader.metadata";

import { registerBuiltInGLTFExtensions } from "./glTF/2.0/Extensions/dynamic";

/**
 * Registers the async plugin factories for all built-in loaders.
 * Loaders will be dynamically imported on demand, only when a SceneLoader load operation needs each respective loader.
 */
export function registerBuiltInLoaders() {
    // Register the glTF loader (2.0) specifically/only.
    registerSceneLoaderPlugin({
        ...GLTFFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            const { GLTFFileLoader } = await import("./glTF/2.0/glTFLoader");
            return new GLTFFileLoader(options[GLTFFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the built-in glTF (2.0) extensions.
    registerBuiltInGLTFExtensions();

    // Register the OBJ loader.
    registerSceneLoaderPlugin({
        ...OBJFileLoaderMetadata,
        createPlugin: async () => {
            const { OBJFileLoader } = await import("./OBJ/objFileLoader");
            return new OBJFileLoader();
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the SPLAT loader.
    registerSceneLoaderPlugin({
        ...SPLATFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            const { SPLATFileLoader } = await import("./SPLAT/splatFileLoader");
            return new SPLATFileLoader(options[SPLATFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the STL loader.
    registerSceneLoaderPlugin({
        ...STLFileLoaderMetadata,
        createPlugin: async () => {
            const { STLFileLoader } = await import("./STL/stlFileLoader");
            return new STLFileLoader();
        },
    } satisfies ISceneLoaderPluginFactory);
}
