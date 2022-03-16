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
} from "@tools/test-tools";

// IN TESTS
declare const BABYLON: typeof import("core/index");

describe("Memory Leaks", () => {
    jest.setTimeout(30000);

    let init: CountValues;

    beforeEach(async () => {
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
            waitUntil: "load", // for chrome should be "networkidle0"
            timeout: 0,
        });
        init = await countObjects(page);
        await page.evaluate(evaluateEventListenerAugmentation);
    });

    it("Should dispose all objects when initializing webxr scene when xr not supported", async () => {
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        await page.evaluate(evaluateCreateScene);
        await page.evaluate(async () => {
            if (!window.scene) {
                throw new Error("Scene not found");
            }
            // This creates and positions a free camera (non-mesh)
            const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), window.scene);

            // This targets the camera to scene origin
            camera.setTarget(BABYLON.Vector3.Zero());

            // This attaches the camera to the canvas
            camera.attachControl(true);

            // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), window.scene);

            // Default intensity is 1. Let's dim the light a small amount
            light.intensity = 0.7;

            // Our built-in 'sphere' shape.
            const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, window.scene);

            // Move the sphere upward 1/2 its height
            sphere.position.y = 1;

            await window.scene.createDefaultXRExperienceAsync();
        });
        await page.evaluate(evaluateRenderScene);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        // await jestPuppeteer.debug()
        await countCurrentObjects(init);
    }, 20000);
});
