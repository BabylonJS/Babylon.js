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
            name: "interaction",
            testMatch: "**/interaction.test.ts",
            use: getUseDefinition("Interaction", "Safari", true),
        },
        {
            name: "performance",
            testMatch: ["**/test/performance/**/*.test.ts", "**/test/playwright/performance.test.ts"],
            use: getUseDefinition("Performance"),
        },
        {
            name: "integration",
            testMatch: "**/test/integration/**/*.test.ts",
            use: getUseDefinition("Integration"),
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
            name: "flowGraphEditor",
            testMatch: "**/flowGraphEditor.test.ts",
            use: getUseDefinition("Flow Graph Editor"),
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
        // Back-compatibility: these projects existed when large-world tests ran as separate suites.
        // Engine options like useLargeWorldRendering are now configured per-test, so these projects
        // have no matching test files. Kept so that any CI config or script referencing them by name
        // continues to work (Playwright silently runs zero tests for an empty match).
        {
            name: "webgl2-largeWorld",
            testMatch: "**/_no-match_",
            use: getUseDefinition("WebGL2"),
        },
        {
            name: "webgpu-largeWorld",
            testMatch: "**/_no-match_",
            use: getUseDefinition("WebGPU", "Chrome", false, true),
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
