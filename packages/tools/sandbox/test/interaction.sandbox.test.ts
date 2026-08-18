import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { getGlobalConfig } from "@tools/test-tools";

test.beforeAll(async () => {
    // Set timeout for this hook.
    test.setTimeout(30000);
});

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const cdnPort = ":" + (process.env.CDN_PORT || 1337);
const sandboxBaseUrl = process.env.SANDBOX_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.SANDBOX_PORT || ":1339");
const url = sandboxBaseUrl + snapshot;
const cameraPresetStorageKey = "Babylon/Sandbox/cameraPresets";
const inspectorTeachingMomentStoragePrefix = "Babylon/Inspector/TeachingMoments/";
const boxAssetUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb";
const boxModelUrl = url + (snapshot ? "&" : "?") + `assetUrl=${boxAssetUrl}`;
const embeddedCameraModelUrl = url + (snapshot ? "&" : "?") + "assetUrl=https://assets.babylonjs.com/meshes/Box/Box_extras.gltf";
const textureAssetUrl = url + (snapshot ? "&" : "?") + "assetUrl=https://assets.babylonjs.com/textures/grass.png";
const cameraPresetId = "test-overview";

interface IStoredCameraPresetState {
    version: number;
    activePresetId: string | null;
    presets: { id: string; name: string; cameraType: string; cameraData: Record<string, unknown> }[];
}

interface ISceneCameraState {
    name: string | undefined;
    id: string | undefined;
    position: number[] | undefined;
    keysUp: number[] | undefined;
    keysDown: number[] | undefined;
    keysLeft: number[] | undefined;
    keysRight: number[] | undefined;
    useAutoRotationBehavior: boolean | undefined;
    useFramingBehavior: boolean | undefined;
    idleRotationWaitTime: number | undefined;
    cameraNames: string[];
    cameraIds: string[];
}

interface ICameraNumericState {
    minZ: number | undefined;
    lowerRadiusLimit: number | null | undefined;
}

interface ISandboxRuntimeInfo {
    engineVersion: string | undefined;
    scriptBaseUrl: string | undefined;
    isViteDevelopment: boolean;
}

function createCameraPresetState(activePresetId: string | null): Record<string, unknown> {
    return {
        version: 1,
        activePresetId,
        presets: [
            {
                id: cameraPresetId,
                name: "Overview",
                cameraType: "ArcRotateCamera",
                cameraData: {
                    name: "Overview",
                    id: "overview-source",
                    type: "ArcRotateCamera",
                    position: [8, 6, 8],
                    target: [0, 0, 0],
                    alpha: 0.75,
                    beta: 1.1,
                    radius: 12,
                    minZ: 0.1,
                    maxZ: 1000,
                    inputsmgr: {
                        ArcRotateCameraKeyboardMoveInput: {
                            keysUp: [90, 87],
                            keysDown: [83],
                            keysLeft: [65, 81],
                            keysRight: [69, 68],
                        },
                        ArcRotateCameraMouseWheelInput: {},
                        ArcRotateCameraPointersInput: {},
                    },
                },
                behaviors: {
                    version: 1,
                    useAutoRotationBehavior: true,
                    useBouncingBehavior: false,
                    useFramingBehavior: false,
                    autoRotation: {
                        idleRotationSpeed: 0,
                        idleRotationWaitTime: 1234,
                        idleRotationSpinupTime: 567,
                        zoomStopsAnimation: true,
                        targetAlpha: null,
                    },
                },
            },
        ],
    };
}

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

async function suppressInspectorTeachingMoments(page: Page): Promise<void> {
    await page.addInitScript((storagePrefix) => {
        const storageGetItem = Storage.prototype.getItem;
        const teachingMomentReads: string[] = [];
        (globalThis as typeof globalThis & { __sandboxInspectorTeachingMomentReads?: string[] }).__sandboxInspectorTeachingMomentReads = teachingMomentReads;
        Storage.prototype.getItem = function (key: string): string | null {
            if (this === localStorage && key.startsWith(storagePrefix)) {
                teachingMomentReads.push(key);
                return "true";
            }
            return storageGetItem.call(this, key);
        };
    }, inspectorTeachingMomentStoragePrefix);
}

async function clearCameraPresetStorage(page: Page): Promise<void> {
    await suppressInspectorTeachingMoments(page);
    await page.addInitScript((storageKey) => {
        const initializedKey = `${storageKey}/testInitialized`;
        if (!sessionStorage.getItem(initializedKey)) {
            localStorage.removeItem(storageKey);
            sessionStorage.setItem(initializedKey, "true");
        }
    }, cameraPresetStorageKey);
}

async function seedCameraPresetStorage(page: Page, activePresetId: string | null): Promise<void> {
    await suppressInspectorTeachingMoments(page);
    await page.addInitScript(
        ({ storageKey, state }) => {
            if (localStorage.getItem(storageKey) === null) {
                localStorage.setItem(storageKey, JSON.stringify(state));
            }
        },
        { storageKey: cameraPresetStorageKey, state: createCameraPresetState(activePresetId) }
    );
}

function getAssetFileName(targetUrl: string): string {
    const assetUrl = new URL(targetUrl).searchParams.get("assetUrl");
    if (!assetUrl) {
        throw new Error(`Expected an assetUrl query parameter in ${targetUrl}`);
    }

    return decodeURIComponent(new URL(assetUrl).pathname.split("/").pop()!);
}

function getVersionedBoxModelUrl(version: string): string {
    const versionedUrl = new URL(sandboxBaseUrl);
    versionedUrl.search = "";
    versionedUrl.hash = "";
    return `${versionedUrl.toString()}?version=${version}&assetUrl=${boxAssetUrl}`;
}

async function waitForLoadedAsset(page: Page, expectedFileName: string): Promise<void> {
    await waitForSandboxReady(page);
    const escapedFileName = expectedFileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(page).toHaveTitle(new RegExp(`${escapedFileName}$`));
    await expect(page.locator("#canvasZone")).toHaveClass(/checkerboard/);
    await expect(page.locator("#babylonjsLoadingDiv")).toHaveCount(0);
}

async function loadSandboxAsset(page: Page, targetUrl: string): Promise<void> {
    await page.goto(targetUrl, { waitUntil: "load" });
    await waitForLoadedAsset(page, getAssetFileName(targetUrl));
}

async function reloadSandboxAsset(page: Page): Promise<void> {
    const expectedFileName = getAssetFileName(page.url());
    await page.reload({ waitUntil: "load" });
    await waitForLoadedAsset(page, expectedFileName);
}

async function readSandboxRuntimeInfo(page: Page): Promise<ISandboxRuntimeInfo> {
    return page.evaluate(() => {
        type BabylonRuntime = {
            Engine?: { Version?: string };
            Tools?: { ScriptBaseUrl?: string };
        };
        const babylon = (globalThis as typeof globalThis & { BABYLON?: BabylonRuntime }).BABYLON;
        const isViteDevelopment = Array.from(document.scripts).some((script) => script.type === "module" && script.src !== "" && new URL(script.src).pathname === "/src/main.ts");

        return {
            engineVersion: babylon?.Engine?.Version,
            scriptBaseUrl: babylon?.Tools?.ScriptBaseUrl,
            isViteDevelopment,
        };
    });
}

async function openInspector(page: Page): Promise<Locator> {
    const inspector = page.locator("#babylon-inspector-container");
    if (!(await inspector.isVisible())) {
        await page.getByTitle("Display inspector").click();
    }
    await expect(inspector).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(() => (globalThis as typeof globalThis & { __sandboxInspectorTeachingMomentReads?: string[] }).__sandboxInspectorTeachingMomentReads?.length ?? 0)
        )
        .toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "dismiss", exact: true })).toHaveCount(0);
    return inspector;
}

async function closeInspector(page: Page): Promise<void> {
    await page.locator("#footer").getByTitle("Display inspector").click({ force: true });
    await expect(page.locator("#babylon-inspector-container")).toHaveCount(0);
}

async function expandInspectorNodes(page: Page): Promise<void> {
    const nodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await expect(nodes).toBeVisible();
    await nodes.focus();
    await nodes.press("ArrowRight");
}

async function readCameraPresetState(page: Page): Promise<IStoredCameraPresetState> {
    return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? "null") as IStoredCameraPresetState, cameraPresetStorageKey);
}

async function readSceneCameraState(page: Page): Promise<ISceneCameraState> {
    return page.evaluate(async () => {
        type CameraState = {
            name: string;
            id: string;
            position?: { asArray(): number[] };
            keysUp?: number[];
            keysDown?: number[];
            keysLeft?: number[];
            keysRight?: number[];
            useAutoRotationBehavior?: boolean;
            useFramingBehavior?: boolean;
            getBehaviorByName?(name: string): { idleRotationWaitTime?: number } | null;
        };
        type SceneState = { activeCamera?: CameraState; cameras: CameraState[] };
        type EngineStoreState = { LastCreatedScene?: SceneState };
        const globalEngineStore = (globalThis as typeof globalThis & { BABYLON?: { EngineStore?: EngineStoreState } }).BABYLON?.EngineStore;
        const engineStoreModuleUrl = performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .find((resourceUrl) => /\/Engines\/engineStore\.js(?:\?|$)/.test(resourceUrl));
        const engineStoreModule = engineStoreModuleUrl ? ((await import(engineStoreModuleUrl)) as { EngineStore?: EngineStoreState }) : undefined;
        const scene = (globalEngineStore ?? engineStoreModule?.EngineStore)?.LastCreatedScene;
        if (!scene) {
            throw new Error("Expected the Sandbox EngineStore.LastCreatedScene to be available");
        }

        const activeCamera = scene.activeCamera;
        return {
            name: activeCamera?.name,
            id: activeCamera?.id,
            position: activeCamera?.position?.asArray(),
            keysUp: activeCamera?.keysUp,
            keysDown: activeCamera?.keysDown,
            keysLeft: activeCamera?.keysLeft,
            keysRight: activeCamera?.keysRight,
            useAutoRotationBehavior: activeCamera?.useAutoRotationBehavior,
            useFramingBehavior: activeCamera?.useFramingBehavior,
            idleRotationWaitTime: (activeCamera?.getBehaviorByName?.("AutoRotation") as { idleRotationWaitTime?: number } | null | undefined)?.idleRotationWaitTime,
            cameraNames: scene.cameras.map((camera) => camera.name),
            cameraIds: scene.cameras.map((camera) => camera.id),
        };
    });
}

async function readActiveCameraNumericState(page: Page): Promise<ICameraNumericState> {
    return page.evaluate(async () => {
        type CameraState = { minZ?: number; lowerRadiusLimit?: number | null };
        type SceneState = { activeCamera?: CameraState };
        type EngineStoreState = { LastCreatedScene?: SceneState };
        const globalEngineStore = (globalThis as typeof globalThis & { BABYLON?: { EngineStore?: EngineStoreState } }).BABYLON?.EngineStore;
        const engineStoreModuleUrl = performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .find((resourceUrl) => /\/Engines\/engineStore\.js(?:\?|$)/.test(resourceUrl));
        const engineStoreModule = engineStoreModuleUrl ? ((await import(engineStoreModuleUrl)) as { EngineStore?: EngineStoreState }) : undefined;
        const activeCamera = (globalEngineStore ?? engineStoreModule?.EngineStore)?.LastCreatedScene?.activeCamera;
        if (!activeCamera) {
            throw new Error("Expected the Sandbox active camera to be available");
        }

        return { minZ: activeCamera.minZ, lowerRadiusLimit: activeCamera.lowerRadiusLimit };
    });
}

function trackPageErrors(page: Page): string[] {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    return pageErrors;
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

test.describe("camera presets", () => {
    test.describe.configure({ timeout: 90000 });
    test.use({ viewport: { width: 1280, height: 720 } });

    test("camera preset controls follow model and footer lifecycle", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await clearCameraPresetStorage(page);

        await loadSandboxAsset(page, embeddedCameraModelUrl);
        const footer = page.locator("#footer");
        await expect(footer.getByTitle("Select camera preset")).toHaveCount(0);
        const cameraSelector = footer.getByTitle("Select camera");
        await expect(cameraSelector).toHaveCount(1);
        await expect(cameraSelector).toBeVisible();

        await page.keyboard.press("Space");
        await expect(footer).toHaveCount(0);
        await page.keyboard.press("Space");
        await expect(page.locator("#footer").getByTitle("Select camera")).toHaveCount(1);

        await loadSandboxAsset(page, boxModelUrl);
        await expect(footer.getByTitle("Select camera preset")).toHaveCount(0);
        await expect(footer.getByTitle("Select camera")).toHaveCount(0);
        expect(pageErrors).toHaveLength(0);
    });

    test("embedded camera selection keeps the default camera active", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await clearCameraPresetStorage(page);
        await loadSandboxAsset(page, embeddedCameraModelUrl);

        const footer = page.locator("#footer");
        const cameraSelector = footer.getByTitle("Select camera");
        await cameraSelector.click();
        await expect(footer.locator(".dropup-content-line")).toHaveText(["Camera", "default camera"]);
        await footer.getByTitle("default camera", { exact: true }).click();
        await cameraSelector.click();
        await expect(footer.getByTitle("default camera", { exact: true }).locator(":scope > div")).toHaveCSS("opacity", "1");
        expect(pageErrors).toHaveLength(0);
    });

    test("camera preset Inspector section follows camera selection and section order", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await clearCameraPresetStorage(page);
        await loadSandboxAsset(page, boxModelUrl);

        const inspector = await openInspector(page);
        await expandInspectorNodes(page);
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
        const customHeader = inspector.getByRole("button", { name: "Custom", exact: true });
        const metadataHeader = inspector.getByRole("button", { name: "Metadata", exact: true });
        await expect(presetHeader).toBeVisible();
        await expect(presetHeader).toHaveAttribute("aria-expanded", "true");
        await expect(customHeader).toBeVisible();
        await expect(metadataHeader).toBeVisible();
        const sectionHeaders = await inspector.locator("button[aria-expanded]").allTextContents();
        expect(sectionHeaders).toContain("Custom");
        expect(sectionHeaders.indexOf("Custom")).toBeLessThan(sectionHeaders.indexOf("Save Camera Preset"));
        expect(sectionHeaders.indexOf("Save Camera Preset")).toBe(sectionHeaders.indexOf("Metadata") - 1);

        await page.getByRole("treeitem", { name: "hdrSkyBox", exact: true }).click();
        await expect(inspector.getByText("Receive Shadows", { exact: true })).toBeVisible();
        await expect(metadataHeader).toBeVisible();
        await expect(presetHeader).toHaveCount(0);
        const meshSectionHeaders = await inspector.locator("button[aria-expanded]").allTextContents();
        expect(meshSectionHeaders).not.toContain("Save Camera Preset");
        if (meshSectionHeaders.includes("Custom")) {
            expect(meshSectionHeaders.indexOf("Metadata")).toBeLessThan(meshSectionHeaders.indexOf("Custom"));
        }
        expect(pageErrors).toHaveLength(0);
    });

    test("camera preset saved through Inspector activates and survives reload", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await clearCameraPresetStorage(page);
        await loadSandboxAsset(page, boxModelUrl);

        const originalCameraState = await readSceneCameraState(page);
        const footer = page.locator("#footer");
        const inspector = await openInspector(page);
        await expandInspectorNodes(page);
        await page.getByRole("treeitem", { name: /^default camera/ }).click();

        const presetHeader = inspector.getByRole("button", { name: "Save Camera Preset", exact: true });
        await expect(presetHeader).toBeVisible();
        const presetSection = presetHeader.locator("xpath=../..");
        const savePresetButton = presetSection.getByRole("button", { name: "Save", exact: true });
        await savePresetButton.click();
        await expect(footer.getByTitle("Select camera preset")).toBeVisible();

        const savedState = await readCameraPresetState(page);
        expect(savedState.activePresetId).toBeNull();
        expect(savedState.presets).toHaveLength(1);
        expect(savedState.presets[0]).toMatchObject({ name: "Preset 1", cameraType: "ArcRotateCamera" });
        expect(savedState.presets[0].cameraData).toMatchObject({ name: originalCameraState.name, id: originalCameraState.id });

        await closeInspector(page);
        await footer.getByTitle("Select camera preset").click();
        await expect(footer.locator(".dropup-content-line")).toHaveText(["Default camera", "Preset 1"]);
        await footer.getByTitle("Preset 1", { exact: true }).click();
        expect((await readCameraPresetState(page)).activePresetId).toBe(savedState.presets[0].id);

        await reloadSandboxAsset(page);
        expect((await readCameraPresetState(page)).activePresetId).toBe(savedState.presets[0].id);
        const restoredCameraState = await readSceneCameraState(page);
        expect(restoredCameraState).toMatchObject({
            name: "Preset 1",
            id: `SandboxCameraPreset/${savedState.presets[0].id}`,
            keysUp: originalCameraState.keysUp,
            keysDown: originalCameraState.keysDown,
            keysLeft: originalCameraState.keysLeft,
            keysRight: originalCameraState.keysRight,
            useAutoRotationBehavior: originalCameraState.useAutoRotationBehavior,
            useFramingBehavior: originalCameraState.useFramingBehavior,
        });
        expect(pageErrors).toHaveLength(0);
    });

    test("camera preset activation survives reload with serialized inputs and behaviors", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, null);
        await loadSandboxAsset(page, boxModelUrl);

        const footer = page.locator("#footer");
        await footer.getByTitle("Select camera preset").click();
        await footer.getByTitle("Overview", { exact: true }).click();
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(await readSceneCameraState(page)).toMatchObject({ name: "Overview", id: `SandboxCameraPreset/${cameraPresetId}` });

        await reloadSandboxAsset(page);
        await footer.getByTitle("Select camera preset").click();
        await expect(footer.getByTitle("Overview", { exact: true }).locator(":scope > div")).toHaveCSS("opacity", "1");
        const restoredCameraState = await readSceneCameraState(page);
        expect(restoredCameraState).toEqual({
            name: "Overview",
            id: `SandboxCameraPreset/${cameraPresetId}`,
            position: expect.any(Array),
            keysUp: [90, 87],
            keysDown: [83],
            keysLeft: [65, 81],
            keysRight: [69, 68],
            useAutoRotationBehavior: true,
            useFramingBehavior: false,
            idleRotationWaitTime: 1234,
            cameraNames: ["default camera", "Overview"],
            cameraIds: ["default camera", `SandboxCameraPreset/${cameraPresetId}`],
        });
        expect(pageErrors).toHaveLength(0);
    });

    test("default camera selection survives reload and removes preset cameras", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, cameraPresetId);
        await loadSandboxAsset(page, boxModelUrl);

        const footer = page.locator("#footer");
        expect(await readSceneCameraState(page)).toMatchObject({ name: "Overview", id: `SandboxCameraPreset/${cameraPresetId}` });

        await footer.getByTitle("Select camera preset").click();
        await footer.getByTitle("Default camera", { exact: true }).click();
        expect((await readCameraPresetState(page)).activePresetId).toBeNull();
        expect(await readSceneCameraState(page)).toMatchObject({ name: "default camera", cameraNames: ["default camera"], cameraIds: ["default camera"] });

        await reloadSandboxAsset(page);
        await footer.getByTitle("Select camera preset").click();
        await expect(footer.getByTitle("Default camera", { exact: true }).locator(":scope > div")).toHaveCSS("opacity", "1");
        expect((await readCameraPresetState(page)).activePresetId).toBeNull();
        expect(await readSceneCameraState(page)).toMatchObject({ name: "default camera", cameraNames: ["default camera"], cameraIds: ["default camera"] });
        expect(pageErrors).toHaveLength(0);
    });

    test("camera query override preserves the stored active camera preset", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, cameraPresetId);

        await loadSandboxAsset(page, embeddedCameraModelUrl + "&camera=0");
        const footer = page.locator("#footer");
        await footer.getByTitle("Select camera", { exact: true }).click();
        await expect(footer.locator(".dropup-content-line")).toHaveText(["Camera"]);
        await expect(footer.getByTitle("Camera", { exact: true }).locator(":scope > div")).toHaveCSS("opacity", "1");
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(await readSceneCameraState(page)).toMatchObject({ name: "Camera", cameraNames: ["Camera"], cameraIds: ["Camera"] });
        expect(pageErrors).toHaveLength(0);
    });

    test("camera position override preserves the stored active camera preset", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, cameraPresetId);

        await loadSandboxAsset(page, boxModelUrl + "&cameraPosition=10,20,30");
        const urlCameraPositionOverride = await readSceneCameraState(page);
        expect(urlCameraPositionOverride.name).toBe("default camera");
        const [positionX, positionY, positionZ] = urlCameraPositionOverride.position!;
        expect(positionY / positionX).toBeCloseTo(2);
        expect(positionZ / positionX).toBeCloseTo(3);
        expect(urlCameraPositionOverride.cameraNames).toEqual(["default camera"]);
        expect(urlCameraPositionOverride.cameraIds).toEqual(["default camera"]);
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(pageErrors).toHaveLength(0);
    });

    test("numeric camera URL overrides persist when the stored preset applies after an asset reload", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, cameraPresetId);

        await loadSandboxAsset(page, boxModelUrl + "&cameraMinZ=0.01&cameraLowerRadiusLimit=0");

        expect(await readSceneCameraState(page)).toMatchObject({
            name: "default camera",
            id: "default camera",
            cameraNames: ["default camera"],
            cameraIds: ["default camera"],
        });
        expect(await readActiveCameraNumericState(page)).toEqual({ minZ: 0.01, lowerRadiusLimit: 0 });
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);

        await page.keyboard.press("r");
        await expect.poll(async () => (await readSceneCameraState(page)).name).toBe("Overview");
        expect(await readSceneCameraState(page)).toMatchObject({
            name: "Overview",
            id: `SandboxCameraPreset/${cameraPresetId}`,
            cameraNames: ["default camera", "Overview"],
            cameraIds: ["default camera", `SandboxCameraPreset/${cameraPresetId}`],
        });
        expect(await readActiveCameraNumericState(page)).toEqual({ minZ: 0.01, lowerRadiusLimit: 0 });
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(pageErrors).toHaveLength(0);
    });

    test("lower radius URL override wins over cameraPosition framing", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await clearCameraPresetStorage(page);

        await loadSandboxAsset(page, boxModelUrl + "&cameraPosition=10,20,30&cameraLowerRadiusLimit=0");

        const cameraState = await readSceneCameraState(page);
        const [positionX, positionY, positionZ] = cameraState.position!;
        expect(positionY / positionX).toBeCloseTo(2);
        expect(positionZ / positionX).toBeCloseTo(3);
        expect((await readActiveCameraNumericState(page)).lowerRadiusLimit).toBe(0);
        expect(pageErrors).toHaveLength(0);
    });

    test("invalid numeric camera URL values do not suppress the active preset", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, cameraPresetId);

        await loadSandboxAsset(page, boxModelUrl + "&cameraMinZ=0&cameraLowerRadiusLimit=-1");

        expect(await readSceneCameraState(page)).toMatchObject({
            name: "Overview",
            id: `SandboxCameraPreset/${cameraPresetId}`,
            cameraNames: ["default camera", "Overview"],
            cameraIds: ["default camera", `SandboxCameraPreset/${cameraPresetId}`],
        });
        expect(await readActiveCameraNumericState(page)).toEqual({ minZ: 0.1, lowerRadiusLimit: null });
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(pageErrors).toHaveLength(0);
    });

    test("numeric camera URL overrides target the selected embedded camera", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, cameraPresetId);

        await loadSandboxAsset(page, embeddedCameraModelUrl + "&camera=0&cameraMinZ=0.02&cameraLowerRadiusLimit=0");

        expect(await readSceneCameraState(page)).toMatchObject({ name: "Camera", cameraNames: ["Camera"], cameraIds: ["Camera"] });
        expect(await readActiveCameraNumericState(page)).toEqual({ minZ: 0.02, lowerRadiusLimit: undefined });
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(pageErrors).toHaveLength(0);
    });

    test("camera presets pause for texture previews and reapply to the next model", async ({ page }) => {
        const pageErrors = trackPageErrors(page);
        await seedCameraPresetStorage(page, cameraPresetId);

        await loadSandboxAsset(page, textureAssetUrl);
        const footer = page.locator("#footer");
        await expect(footer.getByTitle("Select camera preset")).toHaveCount(0);
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(await readSceneCameraState(page)).toMatchObject({ name: "default camera", cameraNames: ["default camera"], cameraIds: ["default camera"] });

        await loadSandboxAsset(page, boxModelUrl);
        await expect(footer.getByTitle("Select camera preset")).toBeVisible();
        await footer.getByTitle("Select camera preset").click();
        await expect(footer.getByTitle("Overview", { exact: true }).locator(":scope > div")).toHaveCSS("opacity", "1");
        expect((await readCameraPresetState(page)).activePresetId).toBe(cameraPresetId);
        expect(await readSceneCameraState(page)).toMatchObject({ name: "Overview", id: `SandboxCameraPreset/${cameraPresetId}` });
        expect(pageErrors).toHaveLength(0);
    });
});

test.describe("historical Inspector camera preset compatibility", () => {
    test.describe.configure({ timeout: 90000 });
    test.use({ viewport: { width: 1280, height: 720 } });

    for (const version of ["8.40.1", "8.51.0"]) {
        test(`saves and activates a camera preset with runtime ${version}`, async ({ page }) => {
            const pageErrors = trackPageErrors(page);
            await clearCameraPresetStorage(page);
            const versionedBoxModelUrl = getVersionedBoxModelUrl(version);

            expect(new URL(versionedBoxModelUrl).searchParams.has("snapshot")).toBe(false);
            await loadSandboxAsset(page, versionedBoxModelUrl);
            const runtimeInfo = await readSandboxRuntimeInfo(page);
            test.skip(
                runtimeInfo.isViteDevelopment,
                `Historical runtime ${version} requires the production Sandbox bootstrap; Vite development loaded local runtime ${runtimeInfo.engineVersion ?? "unknown"}.`
            );
            expect(runtimeInfo.engineVersion, "the production Sandbox bootstrap must load the requested Babylon.js runtime").toBe(version);
            expect(runtimeInfo.scriptBaseUrl, "the requested runtime must configure its versioned script base URL").toBe(`https://cdn.babylonjs.com/v${version}`);

            await page.getByTitle("Display inspector").click();
            await expandInspectorNodes(page);
            await page.getByRole("treeitem", { name: /^default camera/ }).click();

            const presetHeader = page.getByRole("button", { name: "Save Camera Preset", exact: true });
            await expect(presetHeader).toBeVisible();
            const presetSection = presetHeader.locator("xpath=../..");
            await presetSection.getByRole("button", { name: "Save", exact: true }).click();

            const footer = page.locator("#footer");
            const cameraPresetSelector = footer.getByTitle("Select camera preset");
            await expect(cameraPresetSelector).toBeVisible();
            const savedState = await readCameraPresetState(page);
            expect(savedState.activePresetId).toBeNull();
            expect(savedState.presets).toHaveLength(1);
            expect(savedState.presets[0]).toMatchObject({ name: "Preset 1", cameraType: "ArcRotateCamera" });

            await cameraPresetSelector.click({ force: true });
            await footer.getByTitle("Preset 1", { exact: true }).click({ force: true });
            expect((await readCameraPresetState(page)).activePresetId).toBe(savedState.presets[0].id);
            expect(await readSceneCameraState(page)).toMatchObject({
                name: "Preset 1",
                id: `SandboxCameraPreset/${savedState.presets[0].id}`,
            });
            expect(pageErrors).toHaveLength(0);
        });
    }
});
