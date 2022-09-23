import { checkArgs, populateEnvironment } from "@dev/build-tools";

export const getGlobalConfig = (overrideConfig: { root?: string; baseUrl?: string } = {}) => {
    populateEnvironment();
    return {
        snippetUrl: "https://snippet.babylonjs.com",
        pgRoot: "https://playground.babylonjs.com",
        baseUrl: process.env.CDN_BASE_URL || (checkArgs(["--enable-https"], true) ? "https" : "http") + "://localhost:1337",
        root: "https://cdn.babylonjs.com",
        ...overrideConfig,
    };
};

export * from "./utils";
export * from "./visualizationUtils";
export * from "./seleniumTestUtils";
