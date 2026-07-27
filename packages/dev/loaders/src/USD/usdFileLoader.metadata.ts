/* eslint-disable @typescript-eslint/naming-convention */
import { type ISceneLoaderPluginExtensions, type ISceneLoaderPluginMetadata } from "core/index";

/**
 * Metadata describing the USD scene loader plugin (name + supported extensions).
 * Kept side-effect free so it can be imported by the registration layer without pulling in the loader implementation.
 */
export const USDFileLoaderMetadata = {
    name: "usd",

    extensions: {
        // All USD containers are read as binary and the concrete format is sniffed from magic bytes,
        // because a ".usd" file may be either ASCII (usda) or binary crate (usdc).
        ".usd": { isBinary: true, mimeType: "model/vnd.usd" },
        ".usda": { isBinary: true, mimeType: "model/vnd.usda" },
        ".usdc": { isBinary: true, mimeType: "model/vnd.usdc" },
        ".usdz": { isBinary: true, mimeType: "model/vnd.usdz+zip" },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
