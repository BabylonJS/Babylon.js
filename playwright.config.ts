import { defineConfig } from "@playwright/test";
import { populateEnvironment } from "@dev/build-tools";
import { getBabylonServerTestsList } from "./packages/tools/tests/playwright.utils";

populateEnvironment();

const isCI = !!process.env.CI;
const browserType = process.env.BROWSER || (isCI ? "Firefox" : "Chrome");
const numberOfWorkers = process.env.CIWORKERS ? +process.env.CIWORKERS : process.env.CI ? 1 : browserType === "BrowserStack" ? 1 : undefined;

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
    projects: getBabylonServerTestsList(),
    /* Snapshots */
    snapshotPathTemplate: "packages/tools/tests/test/visualization/ReferenceImages/{arg}{ext}",
});
