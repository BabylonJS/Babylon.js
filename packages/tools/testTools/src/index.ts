import { checkArgs, populateEnvironment } from "@dev/build-tools";

/**
 * Get the global configuration for the visualization tests, allowing for overrides of root, baseUrl, and whether to use the dev host.
 * @param overrideConfig Optional configuration overrides for root, baseUrl, and usesDevHost.
 * @returns The global configuration object with the specified overrides applied.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const getGlobalConfig = (overrideConfig: { root?: string; baseUrl?: string; usesDevHost: boolean } = { usesDevHost: false }) => {
    populateEnvironment();
    return {
        snippetUrl: "https://snippet.babylonjs.com",
        pgRoot: "https://playground.babylonjs.com",
        baseUrl: process.env.CDN_BASE_URL || (checkArgs(["--enable-https"], true) ? "https" : "http") + "://localhost:" + (overrideConfig.usesDevHost ? 1338 : 1337),
        root: "https://cdn.babylonjs.com",
        assetsUrl: "https://assets.babylonjs.com",
        ...overrideConfig,
    };
};

export * from "./utils";
export * from "./visualizationUtils";
