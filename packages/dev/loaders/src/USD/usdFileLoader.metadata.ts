// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions, ISceneLoaderPluginMetadata } from "core/index";

export const USDFileLoaderMetadata = {
    name: "usd",

    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".usdz": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
