import { checkArgs, populateEnvironment } from "@dev/build-tools";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getGlobalConfig = (overrideConfig: { root?: string; baseUrl?: string } = {}) => {
    populateEnvironment();
    return {
        snippetUrl: "https://snippet.babylonjs.com",
        pgRoot: "https://playground.babylonjs.com",
        baseUrl: process.env.CDN_BASE_URL || (checkArgs(["--enable-https"], true) ? "https" : "http") + "://localhost:1337",
        root: "https://cdn.babylonjs.com",
        assetsUrl: "https://assets.babylonjs.com",
        ...overrideConfig,
    };
};

export * from "./utils";
export * from "./visualizationUtils";
