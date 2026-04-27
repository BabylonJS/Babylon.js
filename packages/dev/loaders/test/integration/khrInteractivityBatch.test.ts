/**
 * Batch test runner — loads each Khronos GLB test and captures pass/fail.
 * Run: npx playwright test packages/dev/loaders/test/integration/khrInteractivityBatch.test.ts --project=integration --retries=0
 */
import { test, expect, Page } from "@playwright/test";
import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig } from "@tools/test-tools";
import * as fs from "fs";
import * as path from "path";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

interface ConsoleEntry {
    type: string;
    text: string;
}

const KHRONOS_BASE = "E:\\Github\\glTF-Test-Assets-Interactivity\\Tests\\Interactivity";
const SCENE_RUN_DURATION_MS = 3000;

// Discover all GLB files
function findGlbs(dir: string, base: string): { name: string; path: string }[] {
    const results: { name: string; path: string }[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findGlbs(fullPath, base));
        } else if (entry.name.endsWith(".glb") && entry.name !== "Overview.glb" && entry.name !== "mathtests.glb") {
            const rel = path.relative(base, fullPath).replace(/\\/g, "/");
            results.push({ name: rel, path: fullPath });
        }
    }
    return results;
}

const glbs = findGlbs(KHRONOS_BASE, KHRONOS_BASE);

let page: Page;

test.describe("KHR_Interactivity Batch", () => {
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
            waitUntil: "load",
            timeout: 0,
        });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
        await page.waitForFunction(() => window.BABYLON);
        page.setDefaultTimeout(0);
    });

    test.setTimeout(300000); // 5 min total

    test.afterAll(async () => {
        await page.close();
    });

    for (const glb of glbs) {
        test(`${glb.name}`, async () => {
            // Navigate to fresh page for each test
            await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
                waitUntil: "load",
                timeout: 0,
            });
            await page.evaluate(evaluateInitEngine);
            await page.evaluate(evaluateCreateScene);

            const consoleEntries: ConsoleEntry[] = [];
            const consoleHandler = (msg: { type: () => string; text: () => string }) => {
                consoleEntries.push({ type: msg.type(), text: msg.text() });
            };
            page.on("console", consoleHandler);

            try {
                // Read the GLB file and convert to base64 data URL
                const glbBuffer = fs.readFileSync(glb.path);
                const base64 = glbBuffer.toString("base64");
                const dataUrl = `data:model/gltf-binary;base64,${base64}`;

                const loadResult = await page.evaluate(async (url: string) => {
                    try {
                        const scene = window.scene!;
                        await BABYLON.SceneLoader.AppendAsync("", url, scene);
                        return { success: true, error: null };
                    } catch (e: any) {
                        return { success: false, error: e.message || String(e) };
                    }
                }, dataUrl);

                expect(loadResult.success, `Load failed: ${loadResult.error}`).toBe(true);

                // Run scene for duration to let async events fire
                await page.evaluate(async (durationMs: number) => {
                    const scene = window.scene!;
                    const engine = window.engine!;
                    engine.runRenderLoop(() => scene.render());
                    await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
                    engine.stopRenderLoop();
                }, SCENE_RUN_DURATION_MS);

                const bjsMessages = consoleEntries.filter((e) => e.text.startsWith("BJS - "));
                const failedTests = bjsMessages.filter((e) => e.text.includes("ERROR!"));
                const passedTests = bjsMessages.filter((e) => e.text.includes("Test Successful"));

                if (failedTests.length > 0) {
                    console.log(`\n[${glb.name}] Passed: ${passedTests.length}, Failed: ${failedTests.length}`);
                    for (const f of failedTests) {
                        console.log(`  FAIL: ${f.text.substring(0, 200)}`);
                    }
                }

                expect(failedTests.length, `${glb.name}: ${failedTests.length} failed, ${passedTests.length} passed`).toBe(0);
            } finally {
                page.off("console", consoleHandler);
                await page.evaluate(evaluateDisposeEngine);
            }
        });
    }
});
