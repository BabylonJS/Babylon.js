import { checkArgs, populateEnvironment } from "@dev/build-tools";

/**
 * Global configuration used by the memory leak scenarios.
 */
export interface IGlobalConfig {
    /** Base URL for the Babylon server assets. */
    baseUrl: string;
    /** Base URL for the Babylon viewer test app. */
    viewerBaseUrl: string;
    /** CDN root used by helper pages. */
    root: string;
    /** Playground snippet API base URL. */
    snippetUrl: string;
    /** Playground asset base URL. */
    pgRoot: string;
    /** Shared Babylon assets base URL. */
    assetsUrl: string;
}

/**
 * Builds the shared configuration for the memory leak runner.
 * @param overrideConfig Optional configuration overrides.
 * @returns The merged global configuration.
 */
export function GetGlobalConfig(overrideConfig: Partial<IGlobalConfig> = {}): IGlobalConfig {
    populateEnvironment();

    const protocol = checkArgs(["--enable-https"], true) ? "https" : "http";
    const baseUrl = overrideConfig.baseUrl ?? process.env.CDN_BASE_URL ?? `${protocol}://localhost:1337`;
    const viewerPort = process.env.VIEWER_PORT ?? ":1342";
    const viewerBaseUrl = overrideConfig.viewerBaseUrl ?? process.env.VIEWER_BASE_URL ?? baseUrl.replace(":1337", viewerPort);

    return {
        baseUrl,
        viewerBaseUrl,
        root: overrideConfig.root ?? "https://cdn.babylonjs.com",
        snippetUrl: overrideConfig.snippetUrl ?? "https://snippet.babylonjs.com",
        pgRoot: overrideConfig.pgRoot ?? "https://playground.babylonjs.com",
        assetsUrl: overrideConfig.assetsUrl ?? "https://assets.babylonjs.com",
    };
}
