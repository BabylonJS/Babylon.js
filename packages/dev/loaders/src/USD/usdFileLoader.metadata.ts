/* eslint-disable @typescript-eslint/naming-convention */

import { type ISceneLoaderPluginExtensions, type ISceneLoaderPluginMetadata } from "core/Loading/sceneLoader";

/**
 * Defines the USD loader plugin metadata.
 */
export const USDFileLoaderMetadata = {
    name: "usd",
    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".usd": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".usda": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".usdc": { isBinary: true },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".usdz": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
