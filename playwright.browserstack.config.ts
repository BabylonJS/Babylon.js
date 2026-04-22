/**
 * Playwright configuration for BrowserStack Automate SDK runs.
 *
 * The BrowserStack SDK (`browserstack-node-sdk`) replaces Playwright's
 * `projects` array with its own platform-derived projects from
 * `browserstack.yml`. To work with our multi-test-type setup (webgl2,
 * webgpu, performance, etc.), this config puts `testMatch` and `use`
 * settings at the config level so the SDK's auto-generated project
 * inherits them.
 *
 * Usage:
 *   BSTACK_TEST_TYPE=webgl2 npx browserstack-node-sdk playwright test \
 *       --config ./playwright.browserstack.config.ts
 *
 * Supported BSTACK_TEST_TYPE values:
 *   webgl2, webgpu, interaction, performance
 */

import { defineConfig, devices } from "@playwright/test";
import { populateEnvironment } from "@dev/build-tools";
import * as fs from "fs";
import * as path from "path";

populateEnvironment();

const testType = process.env.BSTACK_TEST_TYPE || "webgl2";

// Map test types to human-readable build names for the BrowserStack dashboard.
// BSTACK_BUILD_NAME must be set in the shell environment BEFORE invoking the SDK
// because the SDK reads browserstack.yml (which references ${BSTACK_BUILD_NAME})
// at startup, before this config file executes.
const buildNames: Record<string, string> = {
    webgl2: "Visualization Tests - WebGL2",
    webgpu: "Visualization Tests - WebGPU",
    performance: "Performance Tests",
    interaction: "Interaction Tests",
};
// Still set it here as a fallback for any code that reads the env var later.
process.env.BSTACK_BUILD_NAME = process.env.BSTACK_BUILD_NAME || buildNames[testType] || `Tests - ${testType}`;

// ---------------------------------------------------------------------------
// Dynamic browserstack.yml patching
// The SDK reads browserstack.yml for platform config at startup. We patch
// browser/OS when BSTACK_BROWSER, BSTACK_OS, or BSTACK_OS_VERSION env vars
// are set so nightly cross-browser runs work without multiple YAML files.
// NOTE: buildName uses ${BSTACK_BUILD_NAME} in the YAML — the SDK resolves
// it from the process environment, so it must be set before the SDK starts.
// ---------------------------------------------------------------------------
const bstackYmlPath = path.resolve(__dirname, "browserstack.yml");
if (process.env.BSTACK_BROWSER || process.env.BSTACK_OS || process.env.BSTACK_OS_VERSION) {
    let content = fs.readFileSync(bstackYmlPath, "utf8");
    if (process.env.BSTACK_BROWSER) {
        content = content.replace(/browserName:\s*.+/, `browserName: ${process.env.BSTACK_BROWSER}`);
    }
    if (process.env.BSTACK_OS) {
        content = content.replace(/(\s+)os:\s*.+/, `$1os: ${process.env.BSTACK_OS}`);
    }
    if (process.env.BSTACK_OS_VERSION) {
        content = content.replace(/osVersion:\s*.+/, `osVersion: ${process.env.BSTACK_OS_VERSION}`);
    }
    fs.writeFileSync(bstackYmlPath, content);
}

// Enable BrowserStack Local tunnel when testing against localhost
if (process.env.BROWSERSTACK_LOCAL === "true") {
    let content = fs.readFileSync(bstackYmlPath, "utf8");
    content = content.replace(/browserstackLocal:\s*.+/, "browserstackLocal: true");
    fs.writeFileSync(bstackYmlPath, content);
}

// Override parallelsPerPlatform via env var
if (process.env.BROWSERSTACK_PARALLELS && +process.env.BROWSERSTACK_PARALLELS) {
    let content = fs.readFileSync(bstackYmlPath, "utf8");
    content = content.replace(/parallelsPerPlatform:\s*.+/, `parallelsPerPlatform: ${+process.env.BROWSERSTACK_PARALLELS}`);
    fs.writeFileSync(bstackYmlPath, content);
}

// Patch buildName so each job is identifiable in the BrowserStack dashboard.
// The SDK reads buildName from the YAML at startup (no shell interpolation).
if (process.env.BSTACK_BUILD_NAME) {
    let content = fs.readFileSync(bstackYmlPath, "utf8");
    content = content.replace(/buildName:\s*.+/, `buildName: ${process.env.BSTACK_BUILD_NAME}`);
    fs.writeFileSync(bstackYmlPath, content);
}

// Override testObservability via env var (default is off in the YAML to avoid
// gRPC serialization errors on large payloads like perf tests).
if (process.env.BROWSERSTACK_TEST_OBSERVABILITY === "true") {
    let content = fs.readFileSync(bstackYmlPath, "utf8");
    content = content.replace(/testObservability:\s*.+/, "testObservability: true");
    fs.writeFileSync(bstackYmlPath, content);
}

// ---------------------------------------------------------------------------
// Per-test-type settings: testMatch patterns and browser use options
// ---------------------------------------------------------------------------
const chromeArgs = ["--use-angle=default", "--js-flags=--expose-gc"];
const safariArgs: string[] = [];

interface TestTypeConfig {
    testMatch: string | string[];
    use: Record<string, unknown>;
}

const testConfigs: Record<string, TestTypeConfig> = {
    webgl2: {
        testMatch: "**/*webgl2.test.ts",
        use: {
            ...devices["Desktop Chrome"],
            headless: true,
            launchOptions: { args: chromeArgs },
        },
    },
    webgpu: {
        testMatch: "**/*webgpu.test.ts",
        use: {
            // Real Chrome (not Chromium) required for WebGPU
            channel: "chrome",
            headless: true,
            launchOptions: { args: chromeArgs },
        },
    },
    interaction: {
        testMatch: "**/interaction.test.ts",
        use: {
            ...devices["Desktop Safari"],
            headless: true,
            launchOptions: { args: safariArgs },
        },
    },
    performance: {
        testMatch: "**/test/performance/**/*.test.ts",
        use: {
            ...devices["Desktop Chrome"],
            headless: true,
            launchOptions: { args: chromeArgs },
        },
    },
};

const activeConfig = testConfigs[testType];
if (!activeConfig) {
    throw new Error(`Unknown BSTACK_TEST_TYPE: "${testType}". Valid values: ${Object.keys(testConfigs).join(", ")}`);
}

// Include the performance summary reporter when running performance tests
const isPerformanceRun = testType === "performance";
// Use 'line' reporter for a single updating line showing the current test.
// JUnit and HTML reporters capture full details for CI artifacts.
const baseReporters: any[] = [["line"], ["junit", { outputFile: "junit.xml" }], ["html", { open: "never" }]];
if (isPerformanceRun) {
    baseReporters.push(["./packages/tools/tests/performanceSummaryReporter.ts"]);
}

export default defineConfig({
    fullyParallel: true,
    forbidOnly: true,
    // Performance tests get 1 retry to handle transient BrowserStack issues
    // (socket idle, tunnel drops). Other test types get 2 retries.
    retries: isPerformanceRun ? 2 : 2,
    workers: process.env.CIWORKERS && +process.env.CIWORKERS ? +process.env.CIWORKERS : 2,
    // Performance tests need a long timeout (each test runs multiple interleaved
    // passes of baseline + candidate, ~120s per test).
    timeout: isPerformanceRun ? 300_000 : undefined,
    reporter: baseReporters,
    // Config-level testMatch — inherited by the SDK's auto-generated project
    testMatch: activeConfig.testMatch,
    // Config-level use — merged with the SDK's connectOptions
    use: {
        ...activeConfig.use,
        trace: "on-first-retry",
        ignoreHTTPSErrors: true,
    },
    // No projects array — the SDK creates its own from browserstack.yml platforms.
    // No globalSetup/globalTeardown — the SDK manages BrowserStackLocal automatically.
    snapshotPathTemplate: "packages/tools/tests/test/visualization/ReferenceImages/{arg}{ext}",
});
