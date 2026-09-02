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

for (const solidBackground of ["black", "white"]) {
    test(`SFE displays the grid after switching from a ${solidBackground} preview background`, async ({ page }) => {
        const canvas = await openSfe(page);
        const backgroundSelector = page.locator("#preview-area-bar select").first();

        await backgroundSelector.selectOption(solidBackground);
        await expect(backgroundSelector).toHaveValue(solidBackground);
        await expect(canvas).toHaveScreenshot(`SFE-preview-${solidBackground}-background.png`, {
            maxDiffPixelRatio: 0.02,
        });

        await backgroundSelector.selectOption("grid");
        await expect(backgroundSelector).toHaveValue("grid");
        await expect(canvas).toHaveScreenshot("SFE-preview-grid-after-solid-background.png", {
            maxDiffPixelRatio: 0.02,
        });
    });
}
