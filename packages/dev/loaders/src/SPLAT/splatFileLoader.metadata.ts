import type { ISceneLoaderPluginExtensions, ISceneLoaderPluginMetadata } from "core/index";

export const SPLATFileLoaderMetadata = {
    name: "splat",

    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".splat": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".ply": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".spz": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".json": { isBinary: false },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
