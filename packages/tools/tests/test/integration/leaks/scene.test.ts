import {
    countCurrentObjects,
    countObjects,
    CountValues,
    evaluateCreateScene,
    evaluateDefaultScene,
    evaluateDisposeEngine,
    evaluateDisposeScene,
    evaluateEventListenerAugmentation,
    evaluateInitEngine,
    evaluateRenderScene,
    getGlobalConfig,
    logPageErrors,
} from "@tools/test-tools";

describe("Memory Leaks", () => {
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
        init = await countObjects(page);
        await page.evaluate(evaluateEventListenerAugmentation);
    });

    it("Should dispose all objects when initializing an engine", async () => {
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        await page.evaluate(evaluateDisposeEngine);
        await countCurrentObjects(init);
    }, 20000);

    it("Should not dispose all objects when not disposing the engine", async () => {
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        await countCurrentObjects(init, undefined, false, true);
    }, 20000);

    it("Should dispose all objects when initializing a scene", async () => {
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        await page.evaluate(evaluateCreateScene);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        await countCurrentObjects(init);
    }, 20000);

    it("Should dispose all objects when initializing the default playground scene", async () => {
        const created = await page.evaluate(evaluateInitEngine, "webgl2", getGlobalConfig().baseUrl);
        expect(created).toBe(true);
        await page.evaluate(evaluateCreateScene);
        await page.evaluate(evaluateDefaultScene);
        await page.evaluate(evaluateRenderScene);
        await page.evaluate(evaluateDisposeScene);
        await page.evaluate(evaluateDisposeEngine);
        await countCurrentObjects(init);
    }, 20000);
});
