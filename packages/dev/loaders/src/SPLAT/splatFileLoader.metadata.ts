// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions } from "core/index";

export const SPLATFileLoaderMetadata = {
    name: "splat",

    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".splat": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".ply": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const;
