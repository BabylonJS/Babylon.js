// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions, ISceneLoaderPluginMetadata } from "core/index";

export const STLFileLoaderMetadata = {
    name: "stl",

    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".stl": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
