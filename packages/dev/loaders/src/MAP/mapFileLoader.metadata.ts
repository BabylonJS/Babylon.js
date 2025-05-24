// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions, ISceneLoaderPluginMetadata } from "core/Loading/sceneLoader";

export const MapFileLoaderMetadata = {
    name: "map",
    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".map": { isBinary: false },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
