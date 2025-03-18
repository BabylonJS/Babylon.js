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
        waitUntil: "networkidle",
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
        waitUntil: "networkidle",
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
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});

test("loading a model using query parameters", async ({ page }) => {
    await page.goto(url + (snapshot ? "&" : "?") + "assetUrl=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb", {
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    // wait for #babylonjsLoadingDiv to be hidden
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "hidden" });
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});

test("inspector is opened when clicking on the button", async ({ page }) => {
    await page.goto(url + (snapshot ? "&" : "?") + "assetUrl=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb", {
        waitUntil: "networkidle",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });

    // wait for #babylonjsLoadingDiv to be hidden
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "hidden" });
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });

    // click the "Inspector" button
    await page.getByTitle("Display inspector").click();
    await expect(page.locator("#inspector-host")).toBeVisible();
    await expect(page.locator("#scene-explorer-host")).toBeVisible();
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});
