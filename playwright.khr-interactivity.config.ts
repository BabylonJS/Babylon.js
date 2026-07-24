import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const integrationProject = baseConfig.projects?.find((project) => project.name === "integration");
if (!integrationProject) {
    throw new Error("The integration Playwright project is not defined.");
}

export default defineConfig(baseConfig, {
    testDir: "./packages/dev/loaders/test/external/KHR_interactivity",
    fullyParallel: false,
    retries: 0,
    workers: 1,
    projects: [
        {
            ...integrationProject,
            testMatch: "**/khrInteractivityAllAssets.test.ts",
        },
    ],
    webServer: {
        command: "npm run serve -w @tools/babylon-server -- --host 127.0.0.1",
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
