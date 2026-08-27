import { expect, test, type Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

const cdnPort = ":" + (process.env.CDN_PORT || 1337);
const sfeUrl = process.env.SFE_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.SFE_PORT || ":1346");

async function openSfe(page: Page) {
    await page.setViewportSize({
        width: 1280,
        height: 900,
    });
    const logoUrl = new URL("assets/logo.png", sfeUrl).href;
    await page.route("**/assets/logo.png", async (route) => {
        await route.continue({ url: logoUrl });
    });
    await page.goto(sfeUrl, {
        waitUntil: "load",
    });

    const canvas = page.locator("#sfe-preview-canvas");
    await expect(canvas).toBeVisible({ timeout: 30000 });
    await expect
        .poll(async () => {
            return await canvas.evaluate((element: HTMLCanvasElement) => {
                return !!(element.getContext("webgl2") || element.getContext("webgl"));
            });
        })
        .toBe(true);
    await expect(page.locator("#sfe-log-console")).toContainText("Smart Filter built successfully", { timeout: 30000 });

    return canvas;
}

async function expectCanvasToFillPreview(page: Page) {
    const canvasBounds = await page.locator("#sfe-preview-canvas").boundingBox();
    const previewBounds = await page.locator("#preview").boundingBox();

    expect(canvasBounds).not.toBeNull();
    expect(previewBounds).not.toBeNull();
    expect(Math.abs(canvasBounds!.x - previewBounds!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(canvasBounds!.y - previewBounds!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(canvasBounds!.width - previewBounds!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(canvasBounds!.height - previewBounds!.height)).toBeLessThanOrEqual(1);

    return canvasBounds!;
}

for (const solidBackground of ["black", "white"]) {
    test(`SFE composites the grid after switching from a ${solidBackground} preview background`, async ({ page }) => {
        const canvas = await openSfe(page);
        const backgroundSelector = page.locator("#preview-area-bar select").first();

        await backgroundSelector.selectOption(solidBackground);
        await expect(backgroundSelector).toHaveValue(solidBackground);

        await backgroundSelector.selectOption("grid");
        await expect(backgroundSelector).toHaveValue("grid");

        const screenshot = await canvas.screenshot();
        expect(screenshot).toMatchSnapshot("SFE-preview-grid-after-solid-background.png", {
            maxDiffPixelRatio: 0.02,
        });
    });
}

test("SFE preview canvas fills the main window and popup size modes", async ({ page }) => {
    await openSfe(page);

    const mainSizeSelector = page.locator("#preview-area-bar select").nth(1);
    await mainSizeSelector.selectOption("1.33333");
    await expect(mainSizeSelector).toHaveValue("1.33333");
    const mainCanvasBounds = await expectCanvasToFillPreview(page);
    expect(mainCanvasBounds.width / mainCanvasBounds.height).toBeCloseTo(1.33333, 2);

    const popupPromise = page.waitForEvent("popup");
    await page.locator("#preview-new-window").click();
    const popup = await popupPromise;
    const popupCanvas = popup.locator("#sfe-preview-canvas");
    const popupSizeSelector = popup.locator("#preview-area-bar select").nth(1);

    await expect(popupCanvas).toBeVisible();
    await popupSizeSelector.selectOption("fill");
    await expect(popupSizeSelector).toHaveValue("fill");
    const fillBounds = await expectCanvasToFillPreview(popup);
    expect(fillBounds.width).toBeGreaterThan(300);
    expect(fillBounds.height).toBeGreaterThan(150);

    await popupSizeSelector.selectOption("fixed");
    await expect(popupSizeSelector).toHaveValue("fixed");
    const fixedBounds = await popupCanvas.boundingBox();
    expect(fixedBounds).not.toBeNull();
    expect(fixedBounds!.width).toBe(400);
    expect(fixedBounds!.height).toBe(300);

    await popup.close();
});
