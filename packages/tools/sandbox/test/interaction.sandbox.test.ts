import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { getGlobalConfig } from "@tools/test-tools";

test.beforeAll(async () => {
    // Set timeout for this hook.
    test.setTimeout(30000);
});

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const cdnPort = ":" + (process.env.CDN_PORT || 1337);
const url = (process.env.SANDBOX_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.SANDBOX_PORT || ":1339")) + snapshot;
const cameraPresetStorageKey = "Babylon/Sandbox/cameraPresets";
const boxModelUrl = url + (snapshot ? "&" : "?") + "assetUrl=https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb";
const embeddedCameraModelUrl = url + (snapshot ? "&" : "?") + "assetUrl=https://assets.babylonjs.com/meshes/Box/Box_extras.gltf";
const textureAssetUrl = url + (snapshot ? "&" : "?") + "assetUrl=https://assets.babylonjs.com/textures/grass.png";

/**
 * Wait for the sandbox app to be fully rendered with CSS applied.
 * With Vite, the app loads via a CDN bootstrap → shim → async ES module chain.
 * CSS may not be applied when the "load" event fires, so we explicitly wait for
 * the app DOM, stylesheets, and fonts before interacting or taking screenshots.
 */
async function waitForSandboxReady(page: import("@playwright/test").Page) {
    // Wait for the sandbox React app to render
    await page.waitForSelector("#canvasZone", { state: "visible" });
    // Ensure all stylesheets and fonts are loaded (prevents FOUC in screenshots)
    await page.evaluate(() => document.fonts.ready);
}

test("Sandbox is loaded (Desktop)", async ({ page }) => {
    await page.goto(url, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await waitForSandboxReady(page);
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});

test("Sandbox exposes the render canvas and main controls without page errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto(url, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await waitForSandboxReady(page);

    await expect(page.locator("#renderCanvas")).toBeVisible();
    await expect(page.locator("#droptext")).toBeVisible();
    await expect(page.getByTitle("Open your scene from your hard drive (.babylon, .babylonproj, .gltf, .glb, .fbx, .obj)")).toBeVisible();
    expect(pageErrors).toHaveLength(0);
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
    await page.evaluate(() => document.fonts.ready);
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
    await page.evaluate(() => document.fonts.ready);
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});

test("inspector is opened when clicking on the button", async ({ page }) => {
    await page.goto(boxModelUrl, {
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
    await page.evaluate(() => document.fonts.ready);
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 3000 });
});

test("camera presets can be saved, selected, and restored", async ({ page }) => {
    test.setTimeout(90000);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    // This init script runs on every navigation, so the session flag limits the reset to the first one and lets
    // presets saved later in the test survive the reloads that verify persistence.
    await page.addInitScript((storageKey) => {
        const initializedKey = `${storageKey}/testInitialized`;
        if (!sessionStorage.getItem(initializedKey)) {
            localStorage.removeItem(storageKey);
            sessionStorage.setItem(initializedKey, "true");
        }
    }, cameraPresetStorageKey);

    await page.goto(boxModelUrl, { waitUntil: "load" });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");

    const footer = page.locator("#footer");
    const presetSelector = footer.getByTitle("Select camera preset");
    await expect(presetSelector).toHaveCount(0);
    await expect(footer.getByTitle("Select camera")).toHaveCount(0);

    await page.goto(embeddedCameraModelUrl, { waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    const embeddedCameraFooter = page.locator("#footer");
    await expect(embeddedCameraFooter.getByTitle("Select camera")).toBeVisible();
    await embeddedCameraFooter.getByTitle("Select camera").click();
    await expect(embeddedCameraFooter.locator(".dropup-content-line")).toHaveText(["Camera", "default camera"]);
    await embeddedCameraFooter.getByTitle("default camera", { exact: true }).click();
    await embeddedCameraFooter.getByTitle("Select camera").click();
    await expect(embeddedCameraFooter.getByTitle("default camera", { exact: true }).locator(":scope > div")).toHaveCSS("opacity", "1");
    await embeddedCameraFooter.getByTitle("default camera", { exact: true }).click();
    await page.keyboard.press("Space");
    await expect(embeddedCameraFooter).toHaveCount(0);
    await page.keyboard.press("Space");
    await expect(page.locator("#footer").getByTitle("Select camera")).toBeVisible();

    await page.goto(boxModelUrl, { waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#footer").getByTitle("Select camera")).toHaveCount(0);

    await page.getByTitle("Display inspector").click();
    const inspector = page.locator("#babylon-inspector-container");
    await expect(inspector).toBeVisible();

    const nodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await nodes.focus();
    await nodes.press("ArrowRight");
    await page.getByRole("treeitem", { name: /^default camera/ }).click();
    await page.evaluate(() => {
        const camera = (globalThis as typeof globalThis & { debugNode?: { inspectableCustomProperties?: unknown[] } }).debugNode;
        if (camera) {
            camera.inspectableCustomProperties = [];
        }
    });
    await page.getByRole("treeitem", { name: "hdrSkyBox", exact: true }).click();
    await page.getByRole("treeitem", { name: /^default camera/ }).click();

    const presetHeader = inspector.getByRole("button", { name: "Save Camera Preset", exact: true });
    await expect(presetHeader).toBeVisible();
    await expect(presetHeader).toHaveAttribute("aria-expanded", "true");
    const sectionHeaders = await inspector.locator("button[aria-expanded]").allTextContents();
    expect(sectionHeaders).toContain("Custom");
    expect(sectionHeaders.indexOf("Custom")).toBeLessThan(sectionHeaders.indexOf("Save Camera Preset"));
    expect(sectionHeaders.indexOf("Save Camera Preset")).toBe(sectionHeaders.indexOf("Metadata") - 1);

    await page.getByRole("treeitem", { name: "hdrSkyBox", exact: true }).click();
    const meshSectionHeaders = await inspector.locator("button[aria-expanded]").allTextContents();
    expect(meshSectionHeaders).not.toContain("Save Camera Preset");
    if (meshSectionHeaders.includes("Custom")) {
        expect(meshSectionHeaders.indexOf("Metadata")).toBeLessThan(meshSectionHeaders.indexOf("Custom"));
    }

    await page.getByRole("treeitem", { name: /^default camera/ }).click();

    const presetSection = presetHeader.locator("xpath=../..");
    const presetNameInput = presetSection.getByRole("textbox");
    const savePresetButton = presetSection.getByRole("button", { name: "Save", exact: true });

    await savePresetButton.click();
    await expect(footer.getByTitle("Select camera preset")).toBeVisible();

    await presetNameInput.fill(" City ");
    await savePresetButton.click();
    await presetNameInput.fill("city");
    await savePresetButton.click();

    const savedState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(savedState.activePresetId).toBeNull();
    expect(savedState.presets.map((preset: { name: string }) => preset.name)).toEqual(["Preset 1", "City", "city 2"]);

    await footer.getByTitle("Display inspector").click({ force: true });
    await expect(inspector).toHaveCount(0);

    await footer.getByTitle("Select camera preset").click();
    await expect(footer.locator(".dropup-content-line")).toHaveText(["Default camera", "Preset 1", "City", "city 2"]);
    await footer.getByTitle("Preset 1", { exact: true }).click();

    const selectedState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(selectedState.activePresetId).toBe(selectedState.presets[0].id);

    await page.reload({ waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#footer").getByTitle("Select camera preset")).toBeVisible();

    await page.getByTitle("Display inspector").click();
    await expect(inspector).toBeVisible();
    const reloadedNodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await reloadedNodes.focus();
    await reloadedNodes.press("ArrowRight");

    const restoredCamera = page.getByRole("treeitem", { name: /^Preset 1/ });
    await expect(restoredCamera).toBeVisible();
    await restoredCamera.click();
    await expect(restoredCamera.getByRole("button", { name: "Activate and Attach Controls" })).toHaveAttribute("aria-pressed", "true");

    const navigationKeys = await page.evaluate(() => {
        const camera = (globalThis as typeof globalThis & { debugNode?: Record<string, number[]> }).debugNode;
        return {
            up: camera?.keysUp ?? [],
            down: camera?.keysDown ?? [],
            left: camera?.keysLeft ?? [],
            right: camera?.keysRight ?? [],
        };
    });
    expect(navigationKeys.up.filter((key) => key === 90)).toHaveLength(1);
    expect(navigationKeys.up.filter((key) => key === 87)).toHaveLength(1);
    expect(navigationKeys.down.filter((key) => key === 83)).toHaveLength(1);
    expect(navigationKeys.left.filter((key) => key === 65)).toHaveLength(1);
    expect(navigationKeys.left.filter((key) => key === 81)).toHaveLength(1);
    expect(navigationKeys.right.filter((key) => key === 69)).toHaveLength(1);
    expect(navigationKeys.right.filter((key) => key === 68)).toHaveLength(1);

    await footer.getByTitle("Display inspector").click({ force: true });
    await footer.getByTitle("Select camera preset").click();
    await footer.getByTitle("Default camera", { exact: true }).click();

    const defaultState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(defaultState.activePresetId).toBeNull();

    await page.reload({ waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    const reloadedDefaultState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(reloadedDefaultState.activePresetId).toBeNull();

    await page.getByTitle("Display inspector").click();
    await expect(inspector).toBeVisible();
    const defaultNodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await defaultNodes.focus();
    await defaultNodes.press("ArrowRight");
    const reloadedDefaultCamera = page.getByRole("treeitem", { name: /^default camera/ });
    await expect(reloadedDefaultCamera).toBeVisible();
    await expect(reloadedDefaultCamera.getByRole("button", { name: "Activate and Attach Controls" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("treeitem", { name: /^Preset 1/ })).toHaveCount(0);

    await footer.getByTitle("Display inspector").click({ force: true });
    await footer.getByTitle("Select camera preset").click();
    await footer.getByTitle("Preset 1", { exact: true }).click();
    const reactivatedState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(reactivatedState.activePresetId).toBe(reactivatedState.presets[0].id);

    await page.goto(embeddedCameraModelUrl + "&camera=0", { waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    const cameraOverrideFooter = page.locator("#footer");
    await cameraOverrideFooter.getByTitle("Select camera", { exact: true }).click();
    await expect(cameraOverrideFooter.locator(".dropup-content-line")).toHaveText(["Camera"]);
    await expect(cameraOverrideFooter.getByTitle("Camera", { exact: true }).locator(":scope > div")).toHaveCSS("opacity", "1");
    await page.locator(".clickInterceptor").click();
    const cameraOverrideState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(cameraOverrideState.activePresetId).toBe(cameraOverrideState.presets[0].id);

    await page.goto(boxModelUrl + "&cameraPosition=10,20,30", { waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    if (!(await inspector.isVisible())) {
        await page.getByTitle("Display inspector").click();
    }
    const cameraPositionOverrideNodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await cameraPositionOverrideNodes.focus();
    await cameraPositionOverrideNodes.press("ArrowRight");
    const cameraPositionOverride = page.getByRole("treeitem", { name: /^default camera/ });
    await cameraPositionOverride.click();
    await expect(cameraPositionOverride.getByRole("button", { name: "Activate and Attach Controls" })).toHaveAttribute("aria-pressed", "true");
    const urlCameraPositionOverride = await page.evaluate(() => {
        const activeCamera = (globalThis as typeof globalThis & { debugNode?: { name: string; position: { asArray(): number[] } } }).debugNode;
        return { name: activeCamera?.name, position: activeCamera?.position.asArray() };
    });
    expect(urlCameraPositionOverride.name).toBe("default camera");
    const position = urlCameraPositionOverride.position;
    expect(position).toBeDefined();
    const [positionX, positionY, positionZ] = position!;
    expect(positionY / positionX).toBeCloseTo(2);
    expect(positionZ / positionX).toBeCloseTo(3);
    await expect(page.getByRole("treeitem", { name: /^Preset 1/ })).toHaveCount(0);
    const cameraPositionOverrideState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(cameraPositionOverrideState.activePresetId).toBe(cameraPositionOverrideState.presets[0].id);

    await page.goto(textureAssetUrl, { waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    const textureFooter = page.locator("#footer");
    await expect(textureFooter.getByTitle("Select camera preset")).toHaveCount(0);
    const textureState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(textureState.activePresetId).toBe(textureState.presets[0].id);

    await expect(inspector).toBeVisible();
    const textureNodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await textureNodes.focus();
    await textureNodes.press("ArrowRight");
    const textureCamera = page.getByRole("treeitem", { name: /^default camera/ });
    await expect(textureCamera).toBeVisible();
    await expect(textureCamera.getByRole("button", { name: "Activate and Attach Controls" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("treeitem", { name: /^Preset 1/ })).toHaveCount(0);

    await page.goto(boxModelUrl, { waitUntil: "load" });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#footer").getByTitle("Select camera preset")).toBeVisible();
    const finalState = await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null"), cameraPresetStorageKey);
    expect(finalState.activePresetId).toBe(finalState.presets[0].id);
    await page.getByTitle("Display inspector").click();
    await expect(inspector).toBeVisible();
    const finalNodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await finalNodes.focus();
    await finalNodes.press("ArrowRight");
    const reappliedCamera = page.getByRole("treeitem", { name: /^Preset 1/ });
    await expect(reappliedCamera).toBeVisible();
    await expect(reappliedCamera.getByRole("button", { name: "Activate and Attach Controls" })).toHaveAttribute("aria-pressed", "true");
    expect(pageErrors).toHaveLength(0);
});
