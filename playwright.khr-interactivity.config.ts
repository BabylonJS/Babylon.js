import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const integrationProject = baseConfig.projects?.find((project) => project.name === "integration");
if (!integrationProject) {
    throw new Error("The integration Playwright project is not defined.");
}

export default defineConfig(baseConfig, {
    testDir: "./packages/dev/loaders/test/external/KHR_interactivity",
    fullyParallel: false,
    // A single transient failure (asset fetch, renderer hiccup) should not fail the pipeline, but a
    // retried test is reported as flaky rather than passed, so a genuine intermittent regression
    // still shows up.
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    // Dedicated report paths so this suite does not overwrite the visualization suite's output.
    reporter: process.env.CI
        ? [["line"], ["junit", { outputFile: "khr-interactivity-junit.xml" }], ["html", { open: "never", outputFolder: "khr-interactivity-report" }]]
        : [["list"], ["html", { open: "never", outputFolder: "khr-interactivity-report" }]],
    projects: [
        {
            ...integrationProject,
            testMatch: "**/khrInteractivityAllAssets.test.ts",
        },
    ],
    webServer: {
        // Serve only the UMD bundles (skip the declaration build): the conformance tests load the
        // prebuilt babylon.js UMD from the CDN server and never request the served `.d.ts` files, so
        // the declaration build is unnecessary here and would otherwise fail the server startup in a
        // fresh CI checkout where not every workspace's dist declarations are prebuilt.
        command: "npm run serve:umd-only -w @tools/babylon-server -- --host 127.0.0.1",
        url: "http://127.0.0.1:1337/empty.html",
        reuseExistingServer: process.env.KHR_REUSE_BABYLON_SERVER === "1",
        timeout: 600000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
            ...process.env,
            CDN_BASE_URL: "http://127.0.0.1:1337",
            CDN_PORT: "1337",
            NO_WATCH: "true",
        },
    },
});
