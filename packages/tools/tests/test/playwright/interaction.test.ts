import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization, evaluatePrepareScene, evaluateRenderSceneForVisualization } from "./visualizationPlaywright.utils";

let page: Page;

test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
        // waitUntil: "load", // for chrome should be "networkidle0"
        timeout: 0,
    });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });

    await page.waitForFunction(() => {
        return window.BABYLON;
    });
    page.setDefaultTimeout(0);
    page.setViewportSize({ width: 800, height: 600 });
});

test.afterAll(async () => {
    await page.close();
});

test.beforeEach(async () => {
    await page.evaluate(() => {
        (window as any).testSuccessful = false;
        if (window.scene && window.scene.dispose) {
            // run the dispose function here
            window.scene.dispose();
            window.scene = null;
            window.engine && window.engine.dispose();
            window.engine = null;
        }
    });

    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgl1",
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: " false",
        baseUrl: getGlobalConfig().baseUrl,
    });
});

test.afterEach(async () => {
    await page.evaluate(() => {
        window.engine && window.engine.dispose();
        window.scene = null;
        window.engine = null;
    });
});

test("can process InputManager pointer events", async () => {
    await page.evaluate(evaluatePrepareScene, {
        sceneMetadata: { playgroundId: "#YQUTAY#12" },
        globalConfig: getGlobalConfig(),
    });
    const renderCount = 100;
    const rendering = page.evaluate(evaluateRenderSceneForVisualization, { renderCount });
    const element = page.locator("#babylon-canvas");
    const result = await element.boundingBox();
    if (!result) {
        throw new Error("Element not found");
    }
    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2, { steps: 10 });
    await page.mouse.down({ button: "left" });
    await page.mouse.up({ button: "left" });
    await page.mouse.down({ button: "right" });
    await page.mouse.up({ button: "right" });
    await page.mouse.down({ button: "middle" });
    await page.mouse.up({ button: "middle" });
    await page.waitForTimeout(200);

    await page.evaluate(() => {
        (window as any).BABYLON.Scene.DoubleClickDelay = 500;
    });
    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2, { steps: 10 });
    await page.mouse.down({ button: "left" });
    await page.mouse.up({ button: "left" });
    await page.mouse.down({ button: "left" });
    await page.mouse.up({ button: "left" });
    await page.mouse.down({ button: "right" });
    await page.mouse.up({ button: "right" });
    await page.mouse.down({ button: "right" });
    await page.mouse.up({ button: "right" });
    await page.mouse.down({ button: "middle" });
    await page.mouse.up({ button: "middle" });
    await page.mouse.down({ button: "middle" });
    await page.mouse.up({ button: "middle" });
    await rendering;

    const testStatus = await page.evaluate(() => {
        return (window as any).testSuccessful;
    });
    expect(testStatus).toBe(true);
});

/**
 * This test just verifies that pointer capture is being set and released correctly
 * It should be noted that we can't move the cursor outside of the window so we have to test the
 * pointer capture functions (eg. hasPointerCapture)
 * PG: https://playground.babylonjs.com/#5NMCCT#2
 */
test("check pointer capture", async () => {
    await page.evaluate(evaluatePrepareScene, {
        sceneMetadata: { playgroundId: "#5NMCCT#2" },
        globalConfig: getGlobalConfig(),
    });
    const renderCount = 50;
    const rendering = page.evaluate(evaluateRenderSceneForVisualization, { renderCount });
    const element = page.locator("#babylon-canvas");
    const result = await element.boundingBox();
    if (!result) {
        throw new Error("Element not found");
    }
    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2, { steps: 10 });
    await page.mouse.down();
    await page.mouse.move(result.x + result.width / 2 + 200, result.y + result.height / 2, { steps: 10 });
    await page.mouse.up();

    await rendering;

    const testStatus = await page.evaluate(() => {
        return (window as any).testSuccessful;
    });
    expect(testStatus).toBe(true);
});

/**
 * Check if allowKeyboard logic for camera touch input is validating correctly
 * PG: https://playground.babylonjs.com/#Y4YWCD#9
 */
test("check meta key allowing keyup", async () => {
    await page.evaluate(evaluatePrepareScene, {
        sceneMetadata: { playgroundId: "#Y4YWCD#9" },
        globalConfig: getGlobalConfig(),
    });
    const renderCount = 50;
    const rendering = page.evaluate(evaluateRenderSceneForVisualization, { renderCount });
    const element = page.locator("#babylon-canvas");
    const result = await element.boundingBox();
    if (!result) {
        throw new Error("Element not found");
    }
    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2, { steps: 10 });
    await page.mouse.click(result.x + result.width / 2, result.y + result.height / 2);
    await page.keyboard.down("Meta");
    await page.keyboard.press("c");
    await page.keyboard.up("Meta");

    await page.waitForTimeout(200);

    await page.mouse.move(0, 0, { steps: 10 });

    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2, { steps: 10 });
    await page.mouse.click(result.x + result.width / 2, result.y + result.height / 2);
    await page.keyboard.press("Meta");

    await rendering;

    const testStatus = await page.evaluate(() => {
        return (window as any).testSuccessful;
    });
    expect(testStatus).toBe(true);
});

/**
 * Check if allowMouse logic for camera touch input is validating correctly
 * PG: https://playground.babylonjs.com/#ITQ2NZ#10
 */
/*
NOTE: Disabled temporarily due to flakiness

test("check isMouseEvent", async () => {
    await page.evaluate(evaluatePrepareScene, {
        sceneMetadata: { playgroundId: "#ITQ2NZ#12" },
        globalConfig: getGlobalConfig(),
    });
    await page.mouse.move(50, 50, { steps: 20 });
    const renderCount = 100;
    const rendering = page.evaluate(evaluateRenderSceneForVisualization, { renderCount });
    const element = page.locator("#babylon-canvas");
    const result = await element.boundingBox();
    if (!result) {
        throw new Error("Element not found");
    }
    await page.waitForTimeout(200);
    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2, { steps: 20 });
    await page.mouse.down();
    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2 - 100, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2, { steps: 20 });
    await page.mouse.down();
    await page.mouse.move(result.x + result.width / 2, result.y + result.height / 2 + 100, { steps: 20 });
    await page.mouse.up();
    await rendering;

    const testStatus = await page.evaluate(() => {
        return (window as any).testSuccessful;
    });
    expect(testStatus).toBe(true);
});
*/
