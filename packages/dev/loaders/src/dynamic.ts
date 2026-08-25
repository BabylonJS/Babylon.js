/* eslint-disable @typescript-eslint/naming-convention */

import { type ISceneLoaderPluginFactory, type SceneLoaderPluginOptions, RegisterSceneLoaderPlugin } from "core/Loading/sceneLoader";

import { BVHFileLoaderMetadata } from "./BVH/bvhFileLoader.metadata";
import { FBXFileLoaderMetadata } from "./FBX/fbxFileLoader.metadata";
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
    // Register the BVH loader.
    RegisterSceneLoaderPlugin({
        ...BVHFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            const { BVHFileLoader } = await import("./BVH/bvhFileLoader.pure");
            return new BVHFileLoader(options[BVHFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the FBX loader.
    RegisterSceneLoaderPlugin({
        ...FBXFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            const { FBXFileLoader } = await import("./FBX/fbxFileLoader.pure");
            return new FBXFileLoader(options[FBXFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the glTF loader (2.0) specifically/only.
    RegisterSceneLoaderPlugin({
        ...GLTFFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            const [{ GLTFFileLoader, RegisterGLTF2Loader }, { RegisterInstancedMesh }] = await Promise.all([
                import("./glTF/2.0/glTFLoader.pure"),
                import("core/Meshes/instancedMesh.pure"),
            ]);
            RegisterInstancedMesh();
            RegisterGLTF2Loader();
            return new GLTFFileLoader(options[GLTFFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the built-in glTF (2.0) extensions.
    registerBuiltInGLTFExtensions();

    // Register the OBJ loader.
    RegisterSceneLoaderPlugin({
        ...OBJFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            const { OBJFileLoader } = await import("./OBJ/objFileLoader.pure");
            return new OBJFileLoader(options[OBJFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the SPLAT loader.
    RegisterSceneLoaderPlugin({
        ...SPLATFileLoaderMetadata,
        createPlugin: async (options: SceneLoaderPluginOptions) => {
            const [{ SPLATFileLoader }, { RegisterEnginesExtensionsEngineDynamicTexture }] = await Promise.all([
                import("./SPLAT/splatFileLoader.pure"),
                import("core/Engines/Extensions/engine.dynamicTexture.pure"),
            ]);
            RegisterEnginesExtensionsEngineDynamicTexture();
            return new SPLATFileLoader(options[SPLATFileLoaderMetadata.name]);
        },
    } satisfies ISceneLoaderPluginFactory);

    // Register the STL loader.
    RegisterSceneLoaderPlugin({
        ...STLFileLoaderMetadata,
        createPlugin: async () => {
            const [{ STLFileLoader }, { RegisterStandardMaterial }] = await Promise.all([import("./STL/stlFileLoader.pure"), import("core/Materials/standardMaterial.pure")]);
            RegisterStandardMaterial();
            return new STLFileLoader();
        },
    } satisfies ISceneLoaderPluginFactory);
}
