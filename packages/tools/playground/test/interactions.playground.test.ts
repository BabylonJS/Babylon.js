import { test, expect } from "@playwright/test";

test("Playground is loaded (Desktop)", async ({ page }) => {
    await page.goto("https://playground.babylonjs.com/", {
        waitUntil: "networkidle",
    });
    page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    expect(page.locator("#canvasZone")).toBeVisible();
    expect(page.locator("#monacoHost")).toBeVisible();
    expect(page.locator("#pg-header")).toBeVisible();
});

test("Playground is loaded (Mobile)", async ({ page }) => {
    await page.goto("https://playground.babylonjs.com/", {
        waitUntil: "networkidle",
    });
    page.setViewportSize({
        width: 800,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    expect(page.locator("#canvasZone")).toBeVisible();
    expect(page.locator("#monacoHost")).not.toBeVisible();
    expect(page.locator(".hamburger-button")).toBeVisible();

    // click the "Switch to code" link
    await page.getByTitle("Switch to code").click();
    expect(page.locator("#canvasZone")).not.toBeVisible();
    expect(page.locator("#monacoHost")).toBeVisible();
});

test("Examples can be loaded", async ({ page }) => {
    await page.goto("https://playground.babylonjs.com/", {
        waitUntil: "networkidle",
    });
    page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // click the "Examples" button
    await page.getByTitle("Examples").click();

    expect(page.locator("#examples")).toBeVisible();

    await page.locator(".example").nth(3).click();

    expect(page.url()).toContain("#7V0Y1I#2");
});

test("User can interact with the playground", async ({ page }) => {
    await page.goto("https://playground.babylonjs.com/", {
        waitUntil: "networkidle",
    });
    page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    await page.locator(".view-lines > div:nth-child(16)").click();
    await page.keyboard.type("camera", { delay: 50 });
    expect(page.locator(".editor-widget")).toBeVisible();
    await page.waitForTimeout(100);
    await page.getByLabel("camera", { exact: true }).locator("span").filter({ hasText: "camera" }).first().click();

    // change light's intensity to 0.2
    await page.getByText("0.7").click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("2");

    await page.getByTitle("Run\nAlt+Enter").getByRole("img").click();

    await expect(page.locator("#canvasZone")).toHaveScreenshot();
});
