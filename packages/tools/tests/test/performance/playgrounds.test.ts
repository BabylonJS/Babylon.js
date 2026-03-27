import { test, expect, Page } from "@playwright/test";
import { evaluatePrepareScene, getGlobalConfig, comparePerformance } from "@tools/test-tools";

const perfOptions = {
    framesToRender: 2000,
    numberOfPasses: 10,
    warmupPasses: 2,
    trimCount: 2,
    cdnVersion: process.env.CDN_VERSION || "",
    cdnVersionB: process.env.CDN_VERSION_B || "",
};

const playgrounds = ["#WIR77Z", "#2AH4YH", "#YEZPVT", "#XCPP9Y#1", "#XZ0TH6", "#JU1DZP", "#7V0Y1I#1523", "#6FBD14#2004", "#KQV9SA", "#7CBW04"];

// IN TESTS
// declare const BABYLON: typeof import("core/index");

test.describe("Playground Performance", () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page?.close();
    });

    for (const playgroundId of playgrounds) {
        test(`Performance for playground ${playgroundId}`, async () => {
            test.setTimeout(120000);
            const globalConfig = getGlobalConfig();
            const result = await comparePerformance(page, globalConfig.baseUrl, evaluatePrepareScene, perfOptions, { sceneMetadata: { playgroundId }, globalConfig });
            console.log(`[PERF] Playground ${playgroundId}: ${result.summary}`);
            expect(result.passed, result.summary).toBe(true);
        });
    }
});
