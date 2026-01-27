import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { getGlobalConfig } from "@tools/test-tools";

test.beforeAll(async () => {
    // Set timeout for this hook.
    test.setTimeout(30000);
});

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const url = (process.env.SANDBOX_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.SANDBOX_PORT || ":1339")) + snapshot;

test("Sandbox is loaded (Desktop)", async ({ page }) => {
    await page.goto(url, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // check visibility of both canvas AND the editor
    await expect(page.locator("#canvasZone")).toBeVisible();
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});

test("dropping an image to the sandbox", async ({ page }) => {
    await page.goto(url, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // Read your file into a buffer.
    const buffer = readFileSync(__dirname + "/LogoSandbox.png");

    // Create the DataTransfer and File
    const dataTransfer = await page.evaluateHandle((data) => {
        const dt = new DataTransfer();
        const file = new File([new Uint8Array(data)], "file.png", { type: "image/png" });
        dt.items.add(file);
        return dt;
    }, buffer.toJSON().data);

    // Now dispatch
    await page.dispatchEvent("#renderCanvas", "drop", { dataTransfer });
    // wait for #babylonjsLoadingDiv to be hidden
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "hidden" });
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    // check snapshot of the rendering canvas (the full page includes Inspector, which has a lot of asynchrony and animation, making it hard to get a stable screenshot)
    await expect(page.locator("#renderCanvas")).toHaveScreenshot({ maxDiffPixels: 3000 });
    // but still check that the inspector is displayed
    await expect(page.locator("#babylon-inspector-container")).toBeVisible();
});

test("loading a model using query parameters", async ({ page }) => {
    await page.goto(url + (snapshot ? "&" : "?") + "assetUrl=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb", {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // wait for #babylonjsLoadingDiv to be hidden
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "hidden" });
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});

test("inspector is opened when clicking on the button", async ({ page }) => {
    await page.goto(url + (snapshot ? "&" : "?") + "assetUrl=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb", {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // wait for #babylonjsLoadingDiv to be hidden
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "hidden" });
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");

    // click the "Inspector" button
    await page.getByTitle("Display inspector").click();
    await expect(page.locator("#babylon-inspector-container")).toBeVisible();
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});
