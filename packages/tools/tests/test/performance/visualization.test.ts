import { test, expect, Page } from "@playwright/test";
import { evaluatePrepareScene, getGlobalConfig, comparePerformance } from "@tools/test-tools";
import * as path from "path";
import * as fs from "fs";

/**
 * Visualization performance tests — runs every visualization test case from config.json
 * as a performance comparison (stable CDN vs dev build) for both WebGL2 and WebGPU.
 *
 * Gated by the VISUALIZATION_PERF environment variable. Set it to "true" to enable:
 *   VISUALIZATION_PERF=true npx playwright test --project performance -g "Visualization"
 *
 * You can filter to a specific engine:
 *   VISUALIZATION_PERF=true npx playwright test --project performance -g "webgpu"
 *
 * Or a specific test by title:
 *   VISUALIZATION_PERF=true npx playwright test --project performance -g "Shadows"
 */

const enabled = process.env.VISUALIZATION_PERF === "true";

const configPath = path.join(__dirname, "..", "visualization", "config.json");
const configData = enabled ? JSON.parse(fs.readFileSync(configPath, "utf-8").replace(/^\uFEFF/, "")) : { tests: [] };

interface VisualizationTest {
    title: string;
    playgroundId?: string;
    sceneFolder?: string;
    sceneFilename?: string;
    scriptToRun?: string;
    specificRoot?: string;
    replaceUrl?: string;
    rootPath?: string;
    functionToCall?: string;
    replace?: string;
    excludedEngines?: string[];
    renderCount?: number;
}

const allTests: VisualizationTest[] = configData.tests;

// Only playground-based tests can be run through evaluatePrepareScene reliably.
// sceneFolder/scriptToRun tests also work through evaluatePrepareScene.
const runnableTests = allTests.filter((t) => t.playgroundId || t.sceneFolder || t.scriptToRun);

const engines = ["webgl2", "webgpu"] as const;

const perfOptions = {
    framesToRender: 2000,
    numberOfPasses: 10,
    warmupPasses: 2,
    trimCount: 2,
    cdnVersion: process.env.CDN_VERSION || "",
    cdnVersionB: process.env.CDN_VERSION_B || "",
};

for (const engine of engines) {
    test.describe(`Visualization Performance (${engine})`, () => {
        // Skip the entire suite if not explicitly enabled
        if (!enabled) {
            test.skip();
            return;
        }

        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
        });

        test.afterAll(async () => {
            await page?.close();
        });

        for (const vizTest of runnableTests) {
            // Skip tests that exclude this engine
            if (vizTest.excludedEngines && vizTest.excludedEngines.includes(engine)) {
                continue;
            }

            const testLabel = vizTest.playgroundId ? `${vizTest.title} [${vizTest.playgroundId}]` : vizTest.title;

            test(`${testLabel} (${engine})`, async () => {
                test.setTimeout(180000);
                const globalConfig = getGlobalConfig();
                const sceneMetadata: Record<string, any> = {};

                if (vizTest.playgroundId) {
                    sceneMetadata.playgroundId = vizTest.playgroundId;
                }
                if (vizTest.sceneFolder) {
                    sceneMetadata.sceneFolder = vizTest.sceneFolder;
                    sceneMetadata.sceneFilename = vizTest.sceneFilename;
                }
                if (vizTest.scriptToRun) {
                    sceneMetadata.scriptToRun = vizTest.scriptToRun;
                    if (vizTest.specificRoot) sceneMetadata.specificRoot = vizTest.specificRoot;
                    if (vizTest.functionToCall) sceneMetadata.functionToCall = vizTest.functionToCall;
                    if (vizTest.rootPath) sceneMetadata.rootPath = vizTest.rootPath;
                }
                if (vizTest.replace) sceneMetadata.replace = vizTest.replace;
                if (vizTest.replaceUrl) sceneMetadata.replaceUrl = vizTest.replaceUrl;

                const options = {
                    ...perfOptions,
                    engineName: engine,
                    framesToRender: vizTest.renderCount ? Math.max(vizTest.renderCount * 10, perfOptions.framesToRender) : perfOptions.framesToRender,
                };

                const result = await comparePerformance(page, globalConfig.baseUrl, evaluatePrepareScene, options, { sceneMetadata, globalConfig });
                if (result.skipped) {
                    console.log(`[PERF] SKIPPED ${testLabel} (${engine}): ${result.skipped}`);
                    test.skip(true, result.skipped);
                    return;
                }
                console.log(`[PERF] ${testLabel} (${engine}): ${result.summary}`);
                expect(result.passed, result.summary).toBe(true);
            });
        }
    });
}
