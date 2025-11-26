import { test, expect } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const url = (process.env.PLAYGROUND_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.PLAYGROUND_PORT || ":1338")) + snapshot;

test("Playground is loaded (Desktop)", async ({ page }) => {
    await page.goto(url, {
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    await expect(page.locator("#canvasZone")).toBeVisible();
    await expect(page.locator("#monacoHost")).toBeVisible();
    await expect(page.locator("#pg-header")).toBeVisible();
});

test("Playground is loaded (Mobile)", async ({ page }) => {
    await page.goto(url, {
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 800,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    await expect(page.locator("#canvasZone")).toBeVisible();
    await expect(page.locator("#monacoHost")).not.toBeVisible();
    await expect(page.locator(".hamburger-button")).toBeVisible();

    // click the "Switch to code" link
    await page.getByTitle("Switch to code").click();
    await expect(page.locator("#canvasZone")).not.toBeVisible();
    await expect(page.locator("#monacoHost")).toBeVisible();
});

test("Examples can be loaded", async ({ page }) => {
    await page.goto(url, {
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // click the "Examples" button
    await page.getByTitle("Examples").click();

    await expect(page.locator("#examples")).toBeVisible();

    await page.locator(".example").nth(3).click();

    expect(page.url()).toContain("#");
});

test("User can interact with the playground", async ({ page }) => {
    await page.goto(url, {
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // There is a real condition that can be waiting with an evaluated promise in the browser
    // via the Playground window global... This is a timing hack but the small amount of tests here
    // should make it ok for now.

    await page.waitForTimeout(1500);
    await page.locator(".view-line:nth-of-type(16)").click();
    await page.waitForTimeout(1500);
    await page.keyboard.type("camera", { delay: 50 });
    await expect(page.locator(".editor-widget")).toBeVisible();
    await page.waitForTimeout(100);
    await page.keyboard.press("Escape");

    // change light's intensity to 0.2
    await page.getByText("0.7").click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("2");

    await page.getByTitle("Run\nAlt+Enter").getByRole("img").click();

    await expect(page.locator("#canvasZone")).toHaveScreenshot();
});
