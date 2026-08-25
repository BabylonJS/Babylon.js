import { defineConfig } from "@playwright/test";
import { populateEnvironment } from "@dev/build-tools";
import { getBabylonServerTestsList } from "./packages/tools/tests/playwright.utils";

populateEnvironment();

const isCI = !!process.env.CI;
const browserType = process.env.BROWSER || (isCI ? "Firefox" : "Chrome");
const isBrowserStackRun = browserType === "BrowserStack";
const numberOfWorkers = process.env.CIWORKERS ? +process.env.CIWORKERS : process.env.CI ? 1 : isBrowserStackRun ? 1 : 4;

// Include the performance summary reporter only when running performance tests
const isPerformanceRun = (() => {
    const argv = process.argv;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--project=performance" || argv[i] === "-p=performance") return true;
        if ((argv[i] === "--project" || argv[i] === "-p") && argv[i + 1] === "performance") return true;
        if (argv[i].includes("/test/performance/") || argv[i].includes("\\test\\performance\\")) return true;
    }
    return false;
})();
const baseReporters: any[] = isCI
    ? [["line"], ["junit", { outputFile: "junit.xml" }], ["./packages/tools/tests/publicReportReporter.ts", { outputFolder: "playwright-report" }]]
    : [["list"], ["html"]];
if (isPerformanceRun) {
    baseReporters.push(["./packages/tools/tests/performanceSummaryReporter.ts"]);
}

export default defineConfig({
    // testDir: "./test/playwright",
    /* Run tests in files not in parallel or half are skipped */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 1,
    /* Opt out of parallel tests on CI. */
    workers: numberOfWorkers,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: baseReporters,
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: isBrowserStackRun ? "off" : "on-first-retry",
        ignoreHTTPSErrors: true,
    },

    globalSetup: isBrowserStackRun ? require.resolve("./packages/tools/tests/globalSetup.ts") : undefined,
    globalTeardown: isBrowserStackRun ? require.resolve("./packages/tools/tests/globalTeardown.ts") : undefined,

    /* Project configuration */
    projects: getBabylonServerTestsList(),
    /* Snapshots */
    snapshotPathTemplate: "packages/tools/tests/test/visualization/ReferenceImages/{arg}{ext}",
});
