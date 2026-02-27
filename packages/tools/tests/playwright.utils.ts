import { devices } from "@playwright/test";
import { getCdpEndpoint } from "./browserstack.config";
const customFlags = process.env.CUSTOM_FLAGS ? process.env.CUSTOM_FLAGS.split(" ") : [];
const headless = process.env.HEADLESS !== "false";
const forceChrome = process.env.FORCE_CHROME === "true";

const isCI = !!process.env.CI;
const browserType = process.env.BROWSER || (isCI ? "Firefox" : "Chrome");
const browserStackBrowser = process.env.BROWSERSTACK_BROWSER || "chrome@latest:OSX Sonoma";

export function getBabylonServerTestsList() {
    return [
        {
            name: "webgl2",
            testMatch: "**/*webgl2.test.ts",
            use: getUseDefinition("WebGL2"),
        },
        {
            name: "webgl2-largeWorld",
            testMatch: "**/*webgl2-largeWorld.test.ts",
            use: getUseDefinition("WebGL2"),
        },
        // {
        //     name: "webgl1",
        //     testMatch: "**/*webgl1.test.ts",
        //     use: forceChrome
        //         ? {
        //               // use real chrome (not chromium) for webgpu tests
        //               channel: "chrome",
        //               headless,
        //               launchOptions: {
        //                   args,
        //               },
        //           }
        //         : browserType === "BrowserStack"
        //           ? {
        //                 connectOptions: { wsEndpoint: getCdpEndpoint(browserStackBrowser, "WebGL1") },
        //             }
        //           : {
        //                 ...devices["Desktop " + browserType],
        //                 headless,
        //                 launchOptions: {
        //                     args,
        //                 },
        //             },
        // },
        {
            name: "webgpu",
            testMatch: "**/*webgpu.test.ts",
            use: getUseDefinition("WebGPU", "Chrome", false, true),
        },
        {
            name: "webgpu-largeWorld",
            testMatch: "**/*webgpu-largeWorld.test.ts",
            use: getUseDefinition("WebGPU", "Chrome", false, true),
        },
        {
            name: "interaction",
            testMatch: "**/interaction.test.ts",
            use: getUseDefinition("Interaction", "Safari", true),
        },
        {
            name: "performance",
            testMatch: "**/performance.test.ts",
            use: getUseDefinition("Performance"),
        },
        {
            name: "playground",
            testMatch: "**/*.playground.test.ts",
            use: getUseDefinition("Playground"),
        },
        {
            name: "sandbox",
            testMatch: "**/*.sandbox.test.ts",
            use: getUseDefinition("Sandbox"),
        },
        {
            name: "graphTools",
            testMatch: "**/*.tools.test.ts",
            use: getUseDefinition("Graph Tools"),
        },
        {
            name: "viewer",
            testMatch: "packages/tools/viewer/test/viewer.test.ts",
            use: getUseDefinition("Viewer"),
        },
        {
            name: "webxr",
            testMatch: "**/*.webxr.test.ts",
            use: getUseDefinition("WebXR"),
        },
        {
            name: "audioV2",
            testMatch: "**/audioV2/*.test.ts",
            use: getUseDefinition("AudioV2"),
        },
    ];
}

export function getDevHostTestsList() {
    return [
        {
            name: "lottie",
            testMatch: "**/*lottie.test.ts",
            use: getUseDefinition("Lottie"),
        },
    ];
}

function getUseDefinition(title: string, browser = browserType, noBrowserStack = false, forceChromeInsteadOfChromium = forceChrome) {
    const args = browser === "Chrome" ? ["--use-angle=default", "--js-flags=--expose-gc"] : browser === "Firefox" ? ["-wait-for-browser"] : [];
    args.push(...customFlags);
    if (noBrowserStack) {
        return {
            ...devices["Desktop " + browser],
            headless,
            launchOptions: {
                args,
            },
        };
    }
    return forceChromeInsteadOfChromium && browserType !== "BrowserStack"
        ? {
              // use real chrome (not chromium) for webgpu tests
              channel: "chrome",
              headless,
              launchOptions: {
                  args,
              },
          }
        : browserType === "BrowserStack"
          ? {
                connectOptions: { wsEndpoint: getCdpEndpoint(browserStackBrowser, title) },
            }
          : {
                ...devices["Desktop " + browser],
                headless,
                launchOptions: {
                    args,
                },
            };
}
