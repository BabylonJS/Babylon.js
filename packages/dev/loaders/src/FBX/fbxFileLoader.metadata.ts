import { type ISceneLoaderPluginExtensions, type ISceneLoaderPluginMetadata } from "core/index";

export const FBXFileLoaderMetadata = {
    name: "fbx",

    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".fbx": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
