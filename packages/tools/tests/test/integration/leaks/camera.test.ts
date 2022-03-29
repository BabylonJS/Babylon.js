import {
    countCurrentObjects,
    countObjects,
    CountValues,
    evaluateCreateScene,
    evaluateDisposeEngine,
    evaluateDisposeScene,
    evaluateEventListenerAugmentation,
    evaluateInitEngine,
    evaluateRenderScene,
    getGlobalConfig,
    prepareLeakDetection,
    logPageErrors,
} from "@tools/test-tools";

// IN TESTS
declare const BABYLON: typeof import("core/index");

const classesToCheck = ["BABYLON.Node", "BABYLON.Scene", "BABYLON.ArcRotateCamera"];

describe("Memory Leaks - cameras", () => {
    beforeAll(async () => {
        await logPageErrors(page);
    });
    jest.setTimeout(30000);

    let init: CountValues;

    beforeEach(async () => {
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
            waitUntil: "load", // for chrome should be "networkidle0"
            timeout: 0,
        });
        init = await countObjects(page, classesToCheck);
        await page.evaluate(evaluateEventListenerAugmentation);
    });

    it("Should dispose all objects when using free camera", async () => {
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        await page.evaluate(evaluateCreateScene);
        await page.evaluate(() => {
            if (!window.scene) {
                throw new Error("Scene not found");
            }
            const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), window.scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.attachControl(true);
        });
        await page.evaluate(evaluateRenderScene);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        await countCurrentObjects(init, classesToCheck);
    }, 20000);

    it("Should dispose all objects when using arc rotate camera", async () => {
        // await jestPuppeteer.debug();
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        page.evaluate(prepareLeakDetection, classesToCheck);
        await page.evaluate(evaluateCreateScene);
        await page.evaluate(() => {
            if (!window.scene) {
                throw new Error("Scene not found");
            }
            const camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 0, new BABYLON.Vector3(0, 5, -10), window.scene);
            camera.setTarget(BABYLON.Vector3.Zero());
        });
        await page.evaluate(evaluateRenderScene);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        await countCurrentObjects(init, classesToCheck);
        // await jestPuppeteer.debug();
    }, 20000);

    it("Should dispose all objects when attaching arc rotate camera", async () => {
        // await jestPuppeteer.debug();
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        page.evaluate(prepareLeakDetection, classesToCheck);
        await page.evaluate(evaluateCreateScene);
        await page.evaluate(() => {
            if (!window.scene) {
                throw new Error("Scene not found");
            }
            const camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 0, new BABYLON.Vector3(0, 5, -10), window.scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.attachControl(true);
        });
        await page.evaluate(evaluateRenderScene);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        await countCurrentObjects(init, classesToCheck);
    }, 20000);

    it("Should dispose all objects when using universal camera", async () => {
        // await jestPuppeteer.debug();
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        page.evaluate(prepareLeakDetection, classesToCheck);
        await page.evaluate(evaluateCreateScene);
        await page.evaluate(() => {
            if (!window.scene) {
                throw new Error("Scene not found");
            }
            const camera = new BABYLON.UniversalCamera("camera1", new BABYLON.Vector3(0, 5, -10), window.scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.attachControl(true);
        });
        await page.evaluate(evaluateRenderScene);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        await countCurrentObjects(init, classesToCheck);
    }, 20000);
});
