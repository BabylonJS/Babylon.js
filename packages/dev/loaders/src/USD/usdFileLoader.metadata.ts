/* eslint-disable @typescript-eslint/naming-convention */
import { type ISceneLoaderPluginExtensions, type ISceneLoaderPluginMetadata } from "core/index";

/**
 * Metadata describing the USD scene loader plugin (name + supported extensions).
 * Kept side-effect free so it can be imported by the registration layer without pulling in the loader implementation.
 */
export const USDFileLoaderMetadata = {
    name: "usd",

    extensions: {
        // Both extensions are read as binary so the concrete container is sniffed from magic bytes rather
        // than trusted from the extension: only single-layer USDA text is supported, and a ".usd" file may
        // be either USDA text or a binary crate. Binary crate (usdc) and USDZ package bytes are rejected
        // up front by the resolver; ".usdc"/".usdz" are intentionally not advertised.
        ".usd": { isBinary: true, mimeType: "model/vnd.usd" },
        ".usda": { isBinary: true, mimeType: "model/vnd.usda" },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
