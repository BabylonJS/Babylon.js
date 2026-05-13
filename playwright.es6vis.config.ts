/**
 * Playwright configuration for ES6 Visualization Tests.
 *
 * Verifies that three import styles (barrel, deep, pure) produce visually
 * identical rendering output against committed reference images.
 *
 * Prerequisites: `npm run build:es6` must have been run so that the
 * @babylonjs/* public packages are compiled.
 *
 * Usage:
 *   npx playwright test --config playwright.es6vis.config.ts
 */

import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: "./packages/tools/tests/test/playwright",
    testMatch: "**/es6vis.test.ts",

    fullyParallel: false, // serial — consistent GPU state across styles
    forbidOnly: isCI,
    retries: isCI ? 1 : 0,
    workers: 1,

    reporter: isCI ? [["line"], ["junit", { outputFile: "junit-es6vis.xml" }], ["html", { open: "never" }]] : [["list"], ["html"]],

    use: {
        trace: "on-first-retry",
        baseURL: process.env.ES6VIS_BASE_URL || "http://localhost:1340",
    },

    webServer: {
        command: "npx vite --config packages/tools/tests/es6Vis/vite.config.ts",
        url: process.env.ES6VIS_BASE_URL || "http://localhost:1340",
        reuseExistingServer: !isCI,
        timeout: 60_000,
        stdout: "pipe",
        stderr: "pipe",
    },

    projects: [
        {
            name: "es6vis",
            use: {
                // Use real Chrome for consistent WebGL rendering
                channel: "chrome",
                headless: true,
                launchOptions: {
                    args: ["--use-gl=angle"],
                },
            },
        },
    ],

    snapshotPathTemplate: "packages/tools/tests/test/visualization/ReferenceImages/{arg}{ext}",
});
