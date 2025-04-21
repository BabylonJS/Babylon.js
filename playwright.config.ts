import { defineConfig, devices } from "@playwright/test";
import { populateEnvironment } from "@dev/build-tools";
import { getCdpEndpoint } from "./packages/tools/tests/browserstack.config";
populateEnvironment();

const isCI = !!process.env.CI;
const browserType = process.env.BROWSER || (isCI ? "Firefox" : "Chrome");
const numberOfWorkers = process.env.CIWORKERS ? +process.env.CIWORKERS : process.env.CI ? 1 : browserType === "BrowserStack" ? 1 : undefined;
const customFlags = process.env.CUSTOM_FLAGS ? process.env.CUSTOM_FLAGS.split(" ") : [];
const headless = process.env.HEADLESS !== "false";
const forceChrome = process.env.FORCE_CHROME === "true";

const browserStackBrowser = process.env.BROWSERSTACK_BROWSER || "chrome@latest:OSX Sonoma";

export default defineConfig({
    // testDir: "./test/playwright",
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 1,
    /* Opt out of parallel tests on CI. */
    workers: numberOfWorkers,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ? [["line"], ["junit", { outputFile: "junit.xml" }], ["html", { open: "never" }]] : [["list"], ["html"]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
        ignoreHTTPSErrors: true,
    },

    globalSetup: browserType === "BrowserStack" ? require.resolve("./packages/tools/tests/globalSetup.ts") : undefined,
    globalTeardown: browserType === "BrowserStack" ? require.resolve("./packages/tools/tests/globalTeardown.ts") : undefined,

    /* Project configuration */
    projects: [
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
    ],

    snapshotPathTemplate: "packages/tools/tests/test/visualization/ReferenceImages/{arg}{ext}",
});

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
