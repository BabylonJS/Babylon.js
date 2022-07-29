import { getGlobalConfig, SafariSeleniumEnvironment } from "@tools/test-tools";
import { Button, Key } from "selenium-webdriver";

jest.setTimeout(60000);

describe("safari", () => {
    const testEnv = new SafariSeleniumEnvironment();

    afterAll(async () => {
        await testEnv.quit();
    });

    // Check if allowMouse logic for camera touch input is validating correctly
    // PG: https://playground.babylonjs.com/#ITQ2NZ#9
    it("check isMouseEvent", async () => {
        await testEnv.get(getGlobalConfig().baseUrl + `/empty.html`).then(async () => {
            await testEnv.loadPG("#ITQ2NZ#9", getGlobalConfig(), 1000);
        });
        const el = await testEnv.findElementById("babylon-canvas");

        // With allowMouse = true, touch controls should move camera forward if isMouseEvent is true
        await testEnv.getDriver().actions({ bridge: true }).move({ origin: el }).press().move({ x: 0, y: -200, origin: el }).release().perform();
        await testEnv.getDriver().sleep(1000);

        // Set allowMouse = false (handled in PG) and verify that camera uses mouse controls
        await testEnv.getDriver().actions({ bridge: true }).move({ origin: el }).press().move({ x: 0, y: 200, origin: el }).release().perform();
        await testEnv.getDriver().sleep(1000);

        // Check status after actions
        const testStatus = await testEnv.checkTestSuccessStatus();
        expect(testStatus).toBe(true);
    });

    it("can process InputManager pointer events", async () => {
        await testEnv.get(getGlobalConfig().baseUrl + `/empty.html`).then(async () => {
            await testEnv.loadPG("#YQUTAY#12", getGlobalConfig());
        });

        const el = await testEnv.findElementById("babylon-canvas");
        await testEnv
            .getDriver()
            .actions()
            .move({ origin: el })
            .press(Button.LEFT)
            .release(Button.LEFT)
            .press(Button.RIGHT)
            .release(Button.RIGHT)
            .press(Button.MIDDLE)
            .release(Button.MIDDLE)
            .perform();

        await testEnv.getDriver().sleep(1000);

        await testEnv
            .getDriver()
            .executeScript("BABYLON.Scene.DoubleClickDelay = 500;")
            .then(async () => {
                await testEnv
                    .getDriver()
                    .actions()
                    .move({ origin: el })
                    .press(Button.LEFT)
                    .release(Button.LEFT)
                    .press(Button.LEFT)
                    .release(Button.LEFT)
                    .press(Button.RIGHT)
                    .release(Button.RIGHT)
                    .press(Button.RIGHT)
                    .release(Button.RIGHT)
                    .press(Button.MIDDLE)
                    .release(Button.MIDDLE)
                    .press(Button.MIDDLE)
                    .release(Button.MIDDLE)
                    .perform();
            });

        const testStatus = await testEnv.checkTestSuccessStatus();
        expect(testStatus).toBe(true);
    });

    // This test just verifies that pointer capture is being set and released correctly
    // It should be noted that we can't move the cursor outside of the window so we have to test the
    // pointer capture functions (eg. hasPointerCapture)
    // PG: https://playground.babylonjs.com/#5NMCCT
    it("check pointerCapture", async () => {
        await testEnv.get(getGlobalConfig().baseUrl + `/empty.html`).then(async () => {
            await testEnv.loadPG("#5NMCCT", getGlobalConfig(), 1000);
        });
        const el = await testEnv.findElementById("babylon-canvas");

        // With allowMouse = true, touch controls should move camera forward if isMouseEvent is true
        await testEnv.getDriver().actions({ bridge: true }).move({ origin: el }).press().move({ x: 200, y: 0, origin: el }).release().perform();
        await testEnv.getDriver().sleep(1000);

        // Check status after actions
        const testStatus = await testEnv.checkTestSuccessStatus();
        expect(testStatus).toBe(true);
    });

    //#NL54AT#4
    /*it("check pointerLock", async () => {
        await testEnv.get(getGlobalConfig().baseUrl + `/empty.html`).then(async () => {
            await testEnv.loadPG("#NL54AT#8", getGlobalConfig(), 1000);
        });
        const el = await testEnv.findElementById("babylon-canvas");
        await testEnv.getDriver().sleep(5000);

        // With allowMouse = true, touch controls should move camera forward if isMouseEvent is true
        await testEnv
            .getDriver()
            .actions({ bridge: true })
            .click(el)
            .perform();
            await testEnv.getDriver().sleep(5000);

            await testEnv
            .getDriver()
            .actions({ bridge: true })
            .sendKeys(Key.ESCAPE)
            .perform();
            await testEnv.getDriver().sleep(1000);

        await testEnv
            .getDriver()
            .actions({ bridge: true })
            .press()
            .move({ duration: 500, x: -200, y: 0, origin: el })
            .move({ duration: 500, x: 0, y: -200, origin: el })
            .move({ duration: 500, x: 200, y: 0, origin: el })
            .release()
            .perform();
        await testEnv.getDriver().sleep(1000);

        

            await testEnv
            .getDriver()
            .actions({ bridge: true })
            .sendKeys(Key.ESCAPE)
            .perform();

            console.log(await testEnv.getDriver().executeScript("return globalThis.testLog;"));

        // Check status after actions
        const testStatus = await testEnv.checkTestSuccessStatus();
        expect(testStatus).toBe(true);
    });*/

    // Check if Meta key (Cmd) is not interfering with keys being released properly
    // PG: https://playground.babylonjs.com/#Y4YWCD#9
    it("check Meta key allowing keyup", async () => {
        await testEnv.get(getGlobalConfig().baseUrl + `/empty.html`).then(async () => {
            await testEnv.loadPG("#Y4YWCD#9", getGlobalConfig(), 1000);
        });
        const el = await testEnv.findElementById("babylon-canvas");

        // With allowMouse = true, touch controls should move camera forward if isMouseEvent is true
        await testEnv.getDriver().actions({ bridge: true }).move({ origin: el }).click().keyDown(Key.META).sendKeys("c").keyUp(Key.META).perform();
        await testEnv.getDriver().sleep(1000);
        await testEnv.getDriver().actions({ bridge: true }).move({ origin: el }).click().sendKeys(Key.META).perform();

        // Check status after actions
        const testStatus = await testEnv.checkTestSuccessStatus();
        expect(testStatus).toBe(true);
    });
});

