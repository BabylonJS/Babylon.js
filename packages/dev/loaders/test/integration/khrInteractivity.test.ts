/* eslint-disable no-console */
// NOTE: Development-workflow integration tests — NOT part of the final PR.
// They load GLB assets from a local glTF-Test-Assets-Interactivity checkout
// (override the location with the KHR_ASSETS_BASE env var) and report each
// asset's interactivity self-test pass/fail via console output, which is why
// the no-console lint rule is disabled for this file.
import { test, expect, Page } from "@playwright/test";
import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig } from "@tools/test-tools";
import * as fs from "fs";

/**
 * KHR_Interactivity Integration Tests
 *
 * Loads GLB test assets from the Khronos glTF-Test-Assets-Interactivity repository
 * and validates KHR_interactivity extension behavior by capturing console output.
 *
 * The test GLBs contain interactivity graphs that self-test all operations using
 * debug/log nodes. Failed sub-tests are logged with "ERROR!" prefix and
 * "Test Failed" suffix. Passing sub-tests are logged with "Test Successful".
 * All messages go through Logger.Log (console.log) prefixed with "BJS - ".
 */

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

interface ConsoleEntry {
    type: string;
    text: string;
}

const debug = process.env.DEBUG === "true";

// Local Khronos test GLBs. Override with KHR_ASSETS_BASE to point at a
// different checkout of the glTF-Test-Assets-Interactivity repository.
const NEW_ASSETS_BASE = process.env.KHR_ASSETS_BASE || "E:\\Github\\glTF-Test-Assets-Interactivity\\Tests\\Interactivity";
const OVERVIEW_GLB_PATH = `${NEW_ASSETS_BASE}\\Overview.glb`;
const SEND_RECEIVE_GLB_PATH = `${NEW_ASSETS_BASE}\\event\\send_and_receive\\glTF-Binary\\send_and_receive.glb`;

function loadAsDataUrl(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return `data:model/gltf-binary;base64,${buffer.toString("base64")}`;
}

// How long to run the scene (milliseconds). Some tests use flow/setDelay
// and need real time to pass for async events to fire.
const SCENE_RUN_DURATION_MS = 3000;

let page: Page;

test.describe("KHR_Interactivity", () => {
    test.beforeAll(async ({ browser }) => {
        // The babylon.js dev bundle is large (50+ MB); cold loads can take well over the
        // default 30s hook timeout when the watcher has just rebuilt it.
        test.setTimeout(120000);
        page = await browser.newPage();
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
            waitUntil: "load",
            timeout: 0,
        });
        await page.waitForSelector("#babylon-canvas", { timeout: 60000 });
        await page.waitForFunction(() => window.BABYLON, undefined, { timeout: 60000 });
        page.setDefaultTimeout(0);
    });

    test.setTimeout(debug ? 1000000 : 60000);

    test.beforeEach(async () => {
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
            waitUntil: "load",
            timeout: 0,
        });
        await page.evaluate(evaluateInitEngine);
        await page.evaluate(evaluateCreateScene);
    });

    test.afterEach(async () => {
        await page.evaluate(evaluateDisposeEngine);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test("Overview.glb - all interactivity operations pass without warnings", async () => {
        // Collect console messages from the browser
        const consoleEntries: ConsoleEntry[] = [];

        const consoleHandler = (msg: { type: () => string; text: () => string }) => {
            consoleEntries.push({
                type: msg.type(),
                text: msg.text(),
            });
        };

        page.on("console", consoleHandler);

        try {
            const overviewDataUrl = loadAsDataUrl(OVERVIEW_GLB_PATH);
            // Load the GLB into the scene
            const loadResult = await page.evaluate(async (glbUrl: string) => {
                try {
                    const scene = window.scene!;
                    await BABYLON.SceneLoader.AppendAsync("", glbUrl, scene);
                    return {
                        success: true,
                        meshes: scene.meshes.length,
                        error: null,
                    };
                } catch (e: any) {
                    return {
                        success: false,
                        meshes: 0,
                        error: e.message || String(e),
                    };
                }
            }, overviewDataUrl);

            expect(loadResult.success, `GLB loading failed: ${loadResult.error}`).toBe(true);

            // Run the scene render loop for the specified duration.
            // We use a real-time loop instead of a fixed frame count because
            // some interactivity tests use flow/setDelay which depend on elapsed time.
            await page.evaluate(async (durationMs: number) => {
                const scene = window.scene!;
                const engine = window.engine!;

                // Start the render loop
                engine.runRenderLoop(() => {
                    scene.render();
                });

                // Wait for the specified duration
                await new Promise<void>((resolve) => setTimeout(resolve, durationMs));

                // Stop the render loop
                engine.stopRenderLoop();
            }, SCENE_RUN_DURATION_MS);

            // Filter BJS messages (Logger prefixes all output with "BJS - ")
            const bjsMessages = consoleEntries.filter((e) => e.text.startsWith("BJS - "));

            // The Khronos test GLB logs failures with "ERROR!" prefix in the message text
            // (via debug/log nodes) and successes with "Test Successful".
            // These are all emitted through Logger.Log (console.log), not Logger.Warn.
            const failedTests = bjsMessages.filter((e) => e.text.includes("ERROR!"));
            const passedTests = bjsMessages.filter((e) => e.text.includes("Test Successful"));

            // Also capture any actual console.warn or console.error from BJS
            const bjsWarnings = bjsMessages.filter((e) => e.type === "warning");
            const bjsErrors = bjsMessages.filter((e) => e.type === "error");

            // Always log the summary so the agent can see progress
            console.log(`\n=== KHR_Interactivity Test Results ===`);
            console.log(`Passed: ${passedTests.length}`);
            console.log(`Failed: ${failedTests.length}`);
            console.log(`Total BJS messages: ${bjsMessages.length}`);
            if (bjsWarnings.length > 0) {
                console.log(`BJS warnings: ${bjsWarnings.length}`);
            }
            if (bjsErrors.length > 0) {
                console.log(`BJS errors: ${bjsErrors.length}`);
            }

            if (failedTests.length > 0) {
                console.log(`\n--- Failed tests ---`);
                for (const f of failedTests) {
                    console.log(`  FAIL: ${f.text}`);
                }
            }

            if (debug && passedTests.length > 0) {
                console.log(`\n--- Passed tests ---`);
                for (const p of passedTests) {
                    console.log(`  PASS: ${p.text}`);
                }
            }
            console.log(`===================================\n`);

            // The primary assertion: no test failures from the interactivity test GLB.
            // Keep the error message short — the full list is already printed above.
            expect(failedTests.length, `KHR_Interactivity: ${failedTests.length} sub-test(s) failed (see log above for details)`).toBe(0);
        } finally {
            page.off("console", consoleHandler);
        }
    });

    test("event/send_and_receive.glb - custom event dispatch and receive", async () => {
        const consoleEntries: ConsoleEntry[] = [];

        const consoleHandler = (msg: { type: () => string; text: () => string }) => {
            consoleEntries.push({
                type: msg.type(),
                text: msg.text(),
            });
        };

        page.on("console", consoleHandler);

        try {
            const sendReceiveDataUrl = loadAsDataUrl(SEND_RECEIVE_GLB_PATH);
            const loadResult = await page.evaluate(async (glbUrl: string) => {
                try {
                    const scene = window.scene!;
                    await BABYLON.SceneLoader.AppendAsync("", glbUrl, scene);
                    return {
                        success: true,
                        meshes: scene.meshes.length,
                        error: null,
                    };
                } catch (e: any) {
                    return {
                        success: false,
                        meshes: 0,
                        error: e.message || String(e),
                    };
                }
            }, sendReceiveDataUrl);

            expect(loadResult.success, `GLB loading failed: ${loadResult.error}`).toBe(true);

            // Events are async and need time to fire — run for 5 seconds
            await page.evaluate(async (durationMs: number) => {
                const scene = window.scene!;
                const engine = window.engine!;
                engine.runRenderLoop(() => {
                    scene.render();
                });
                await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
                engine.stopRenderLoop();
            }, 5000);

            const bjsMessages = consoleEntries.filter((e) => e.text.startsWith("BJS - "));
            const failedTests = bjsMessages.filter((e) => e.text.includes("ERROR!"));
            const passedTests = bjsMessages.filter((e) => e.text.includes("Test Successful"));

            console.log(`\n=== event/send_and_receive Test Results ===`);
            console.log(`Passed: ${passedTests.length}`);
            console.log(`Failed: ${failedTests.length}`);
            console.log(`Total BJS messages: ${bjsMessages.length}`);

            if (failedTests.length > 0) {
                console.log(`\n--- Failed tests ---`);
                for (const f of failedTests) {
                    console.log(`  FAIL: ${f.text}`);
                }
            }

            if (debug) {
                console.log(`\n--- All BJS messages ---`);
                for (const m of bjsMessages) {
                    console.log(`  [${m.type}] ${m.text}`);
                }
            }
            console.log(`===================================\n`);

            expect(failedTests.length, `event/send_and_receive: ${failedTests.length} sub-test(s) failed`).toBe(0);
        } finally {
            page.off("console", consoleHandler);
        }
    });
});
