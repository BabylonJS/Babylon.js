/**
 * Playwright configuration for running tests on BrowserStack via CDP.
 *
 * Connects to a remote Chrome on BrowserStack using Playwright's built-in
 * `connectOptions.wsEndpoint`. No BrowserStack SDK or browserstack.yml needed.
 *
 * Usage:
 *   BSTACK_TEST_TYPE=webgl2 npx playwright test \
 *       --config ./playwright.browserstack.config.ts
 *
 * Supported BSTACK_TEST_TYPE values:
 *   webgl2, webgpu, interaction, performance
 */

import { defineConfig } from "@playwright/test";
import { populateEnvironment } from "@dev/build-tools";

populateEnvironment();

if (!process.env.BROWSERSTACK_USERNAME || !process.env.BROWSERSTACK_ACCESS_KEY) {
    throw new Error("BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set. " + "Add them to .env at the repo root or export them in your shell.");
}

// Derive installed Playwright version so the BrowserStack capability stays in
// sync with the repo's dependency and doesn't silently drift after upgrades.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const playwrightVersion: string = require("@playwright/test/package.json").version;

const testType = process.env.BSTACK_TEST_TYPE || "webgl2";
const isPerformanceRun = testType === "performance";

// ---------------------------------------------------------------------------
// BrowserStack CDP capabilities
// ---------------------------------------------------------------------------
const caps = {
    browser: process.env.BSTACK_BROWSER || "chrome",
    browser_version: process.env.BSTACK_BROWSER_VERSION || "latest",
    os: process.env.BSTACK_OS || "OS X",
    os_version: process.env.BSTACK_OS_VERSION || "Sonoma",
    project: "Babylon.js",
    build: process.env.BSTACK_BUILD_NAME || `Tests - ${testType}`,
    name: `Babylon.js ${testType}`,
    "browserstack.username": process.env.BROWSERSTACK_USERNAME,
    "browserstack.accessKey": process.env.BROWSERSTACK_ACCESS_KEY,
    "browserstack.console": "errors",
    "browserstack.networkLogs": "false",
    "browserstack.debug": "false",
    "browserstack.idleTimeout": "300",
    "browserstack.playwrightVersion": playwrightVersion,
};

const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;

// ---------------------------------------------------------------------------
// Per-test-type testMatch patterns
// ---------------------------------------------------------------------------
const testConfigs: Record<string, { testMatch: string | string[] }> = {
    webgl2: { testMatch: "**/*webgl2.test.ts" },
    webgpu: { testMatch: "**/*webgpu.test.ts" },
    interaction: { testMatch: "**/interaction.test.ts" },
    performance: { testMatch: "**/test/performance/visualization.test.ts" },
};

const activeConfig = testConfigs[testType];
if (!activeConfig) {
    throw new Error(`Unknown BSTACK_TEST_TYPE: "${testType}". Valid values: ${Object.keys(testConfigs).join(", ")}`);
}

// ---------------------------------------------------------------------------
// Reporters
// ---------------------------------------------------------------------------
const baseReporters: any[] = [["line"], ["junit", { outputFile: "junit.xml" }], ["html", { open: "never" }]];
if (isPerformanceRun) {
    baseReporters.push(["./packages/tools/tests/performanceSummaryReporter.ts"]);
}

export default defineConfig({
    fullyParallel: true,
    forbidOnly: true,
    retries: 2,
    workers: process.env.CIWORKERS && +process.env.CIWORKERS ? +process.env.CIWORKERS : 2,
    timeout: isPerformanceRun ? 300_000 : undefined,
    reporter: baseReporters,
    testMatch: activeConfig.testMatch,
    use: {
        connectOptions: { wsEndpoint },
        trace: "on-first-retry",
        ignoreHTTPSErrors: true,
    },
    snapshotPathTemplate: "packages/tools/tests/test/visualization/ReferenceImages/{arg}{ext}",
});
