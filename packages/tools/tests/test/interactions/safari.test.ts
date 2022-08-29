import { CheckTestSuccessStatus, getGlobalConfig, LoadPlayground, macOSSafariCapabilities } from "@tools/test-tools";
import { Builder, Button, By, Key } from "selenium-webdriver";

jest.setTimeout(60000);

describe("safari", () => {
    const hubURL = "https://hub.browserstack.com/wd/hub";
    // If running on local MacOS machine, use local WebDriver
    const driver = process.platform === "darwin" ? new Builder().forBrowser("safari").build() : new Builder().usingServer(hubURL).withCapabilities(macOSSafariCapabilities).build();

    beforeAll(async () => {
        await driver.get(getGlobalConfig().baseUrl + `/empty.html`);
    });

    afterAll(async () => {
        await driver.quit();
    });

    // Check if allowMouse logic for camera touch input is validating correctly
    // PG: https://playground.babylonjs.com/#ITQ2NZ#9
    it("check isMouseEvent", async () => {
        await LoadPlayground(driver, "#ITQ2NZ#9", getGlobalConfig(), 1000);
        const el = await driver.findElement(By.id("babylon-canvas"));

        // With allowMouse = true, touch controls should move camera forward if isMouseEvent is true
        await driver.actions().move({ origin: el }).press().move({ x: 0, y: -200, origin: el }).release().perform();
        await driver.sleep(1000);

        // Set allowMouse = false (handled in PG) and verify that camera uses mouse controls
        await driver.actions().move({ origin: el }).press().move({ x: 0, y: 200, origin: el }).release().perform();
        await driver.sleep(1000);

        // Check status after actions
        const testStatus = await CheckTestSuccessStatus(driver);
        expect(testStatus).toBe(true);
    });

    it("can process InputManager pointer events", async () => {
        await LoadPlayground(driver, "#YQUTAY#12", getGlobalConfig());
        const el = await driver.findElement(By.id("babylon-canvas"));

        await driver
            .actions()
            .move({ origin: el })
            .press(Button.LEFT)
            .release(Button.LEFT)
            .press(Button.RIGHT)
            .release(Button.RIGHT)
            .press(Button.MIDDLE)
            .release(Button.MIDDLE)
            .perform();

        await driver.sleep(1000);

        await driver.executeScript("BABYLON.Scene.DoubleClickDelay = 500;").then(async () => {
            await driver
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

        const testStatus = await CheckTestSuccessStatus(driver);
        expect(testStatus).toBe(true);
    });

    // This test just verifies that pointer capture is being set and released correctly
    // It should be noted that we can't move the cursor outside of the window so we have to test the
    // pointer capture functions (eg. hasPointerCapture)
    // PG: https://playground.babylonjs.com/#5NMCCT
    it("check pointerCapture", async () => {
        await LoadPlayground(driver, "#5NMCCT", getGlobalConfig(), 1000);
        const el = await driver.findElement(By.id("babylon-canvas"));

        // With allowMouse = true, touch controls should move camera forward if isMouseEvent is true
        await driver.actions().move({ origin: el }).press().move({ x: 200, y: 0, origin: el }).release().perform();
        await driver.sleep(1000);

        // Check status after actions
        const testStatus = await CheckTestSuccessStatus(driver);
        expect(testStatus).toBe(true);
    });

    // Check if Meta key (Cmd) is not interfering with keys being released properly
    // PG: https://playground.babylonjs.com/#Y4YWCD#9
    it("check Meta key allowing keyup", async () => {
        await LoadPlayground(driver, "#Y4YWCD#9", getGlobalConfig(), 1000);
        const el = await driver.findElement(By.id("babylon-canvas"));

        // With allowMouse = true, touch controls should move camera forward if isMouseEvent is true
        await driver.actions().move({ origin: el }).click().keyDown(Key.META).sendKeys("c").keyUp(Key.META).perform();
        await driver.sleep(1000);
        await driver.actions().move({ origin: el }).click().sendKeys(Key.META).perform();

        // Check status after actions
        const testStatus = await CheckTestSuccessStatus(driver);
        expect(testStatus).toBe(true);
    });
});

