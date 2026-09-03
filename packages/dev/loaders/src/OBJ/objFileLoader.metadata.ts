import { type ISceneLoaderPluginExtensions, type ISceneLoaderPluginMetadata } from "core/index";

export const OBJFileLoaderMetadata = {
    name: "obj",

    // Read the file as bytes so the loader can decode non-UTF-8 OBJ files.
    extensions: {
        ".obj": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
