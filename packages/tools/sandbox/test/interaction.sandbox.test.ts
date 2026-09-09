import { test, expect, type JSHandle, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { getGlobalConfig } from "@tools/test-tools";
import { type Scene } from "core/scene";
import { type ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { type FreeCamera } from "core/Cameras/freeCamera";

test.beforeAll(async () => {
    // Set timeout for this hook.
    test.setTimeout(30000);
});

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const cdnPort = ":" + (process.env.CDN_PORT || 1337);
const url = (process.env.SANDBOX_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.SANDBOX_PORT || ":1339")) + snapshot;

/**
 * Wait for the sandbox app to be fully rendered with CSS applied.
 * With Vite, the app loads via a CDN bootstrap → shim → async ES module chain.
 * CSS may not be applied when the "load" event fires, so we explicitly wait for
 * the app DOM, stylesheets, and fonts before interacting or taking screenshots.
 */
async function waitForSandboxReady(page: Page) {
    // Wait for the sandbox React app to render
    await page.waitForSelector("#canvasZone", { state: "visible" });
    // Ensure all stylesheets and fonts are loaded (prevents FOUC in screenshots)
    await page.evaluate(() => document.fonts.ready);
}

async function getSandboxScene(page: Page): Promise<JSHandle<Scene>> {
    return await page.evaluateHandle(async () => {
        const babylonGlobal = globalThis as typeof globalThis & {
            BABYLON?: {
                EngineStore: typeof import("core/Engines/engineStore").EngineStore;
            };
        };
        const findScene = (engineStore: typeof import("core/Engines/engineStore").EngineStore | undefined) => {
            const scenes = engineStore?.Instances.flatMap((engine) => engine.scenes) ?? [];
            for (let index = scenes.length - 1; index >= 0; index--) {
                if (scenes[index].getEngine().getRenderingCanvas()?.id === "renderCanvas") {
                    return scenes[index];
                }
            }
            return undefined;
        };

        let engineStore = babylonGlobal.BABYLON?.EngineStore;
        for (let attempt = 0; attempt < 100; attempt++) {
            if (!engineStore) {
                const engineStoreModuleUrl = performance.getEntriesByType("resource").find((entry) => entry.name.includes("/core/dist/Engines/engineStore.js"))?.name;
                if (engineStoreModuleUrl) {
                    const engineStoreModule = (await import(engineStoreModuleUrl)) as typeof import("core/Engines/engineStore");
                    engineStore = engineStoreModule.EngineStore;
                }
            }

            const scene = findScene(engineStore);
            if (scene?.cameras.some((camera) => camera.name === "default camera")) {
                return scene;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error("The Sandbox scene was not found");
    });
}

async function dropTextFiles(page: Page, files: Array<{ name: string; path: string; contents: string }>): Promise<void> {
    const dataTransfer = await page.evaluateHandle((fileDefinitions) => {
        const transfer = new DataTransfer();
        for (const definition of fileDefinitions) {
            const file = new File([definition.contents], definition.name, { type: "model/vnd.usd" });
            Object.defineProperty(file, "webkitRelativePath", { value: definition.path });
            transfer.items.add(file);
        }
        return transfer;
    }, files);

    await page.dispatchEvent("#renderCanvas", "drop", { dataTransfer });
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
    await expect(page).toHaveScreenshot({ maxDiffPixels: 4000 });
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
    await expect(page.getByTitle("Open your scene from your hard drive (.babylon, .babylonproj, .gltf, .glb, .fbx, .obj, .usd, .usda, .usdc, .usdz)")).toBeVisible();
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

test("dropping a USD file to the sandbox", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(url, { waitUntil: "load" });
    await waitForSandboxReady(page);

    await dropTextFiles(page, [
        {
            name: "scene.usd",
            path: "scene.usd",
            contents: `#usda 1.0
(
    defaultPrim = "World"
    metersPerUnit = 1
    upAxis = "Y"
)
def Xform "World"
{
    def Cube "SandboxCube"
    {
        double size = 2
    }
}
`,
        },
    ]);

    const scene = await getSandboxScene(page);
    await expect.poll(async () => await scene.evaluate((loadedScene) => loadedScene.meshes.some((mesh) => mesh.name === "SandboxCube"))).toBe(true);
});

for (const extension of ["usda", "usdc", "usdz"]) {
    test(`dropping real ${extension.toUpperCase()} preserves USD prototype instances`, async ({ page }) => {
        test.setTimeout(60000);
        await page.goto(url, { waitUntil: "load" });
        await waitForSandboxReady(page);

        const buffer = readFileSync(`${__dirname}/../../babylonServer/public/babylonUsdImporter/testAssets/instances.${extension}`);
        const dataTransfer = await page.evaluateHandle(
            ({ bytes, extension }) => {
                const transfer = new DataTransfer();
                transfer.items.add(new File([new Uint8Array(bytes)], `instances.${extension}`));
                return transfer;
            },
            { bytes: [...buffer], extension }
        );
        await page.dispatchEvent("#renderCanvas", "drop", { dataTransfer });

        const scene = await getSandboxScene(page);
        const result = await scene.evaluate((loadedScene) => {
            const meshes = loadedScene.meshes.filter((mesh) => mesh.getTotalVertices() > 0);
            meshes.forEach((mesh) => mesh.computeWorldMatrix(true));
            return {
                meshes: meshes.length,
                instances: meshes.filter((mesh) => mesh.getClassName() === "InstancedMesh").length,
                sharedGeometry: meshes.length === 2 && meshes[0].geometry === meshes[1].geometry,
                vertices: meshes.map((mesh) => mesh.getTotalVertices()),
                indices: meshes.map((mesh) => Array.from(mesh.getIndices() ?? [])),
                translations: meshes.map((mesh) => mesh.getWorldMatrix().m[12]).sort((a, b) => a - b),
            };
        });
        expect(result.meshes).toBe(2);
        expect(result.instances).toBe(1);
        expect(result.sharedGeometry).toBe(true);
        expect(result.vertices).toEqual([3, 3]);
        expect(result.indices[0]).toHaveLength(3);
        expect(result.indices[1]).toEqual(result.indices[0]);
        expect(result.translations).toEqual([0, 2]);
    });
}

test("dropping a composed USD folder preserves paths and allows root selection", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(url, { waitUntil: "load" });
    await waitForSandboxReady(page);

    await dropTextFiles(page, [
        {
            name: "Main.usda",
            path: "Package/Main.usda",
            contents: `#usda 1.0
(
    defaultPrim = "World"
    metersPerUnit = 1
    upAxis = "Y"
)
def Xform "World"
{
    def Xform "ReferencedModel" (
        prepend references = @./Layers/Geometry.usda@
    )
    {
    }
}
`,
        },
        {
            name: "Geometry.usda",
            path: "Package/Layers/Geometry.usda",
            contents: `#usda 1.0
(
    defaultPrim = "ReferencedModel"
)
def Xform "ReferencedModel"
{
    def Sphere "NestedSphere"
    {
        double radius = 1
    }
}
`,
        },
    ]);

    await expect(page.locator("#usdRootSelectionPrompt")).toBeVisible();
    await page.locator("#usdRootSelectionPrompt .prompt-file-list button", { hasText: "Package/Main.usda" }).click();

    const scene = await getSandboxScene(page);
    await expect.poll(async () => await scene.evaluate((loadedScene) => loadedScene.meshes.some((mesh) => mesh.name === "NestedSphere"))).toBe(true);
});

test("canceling USD root selection does not replace the current scene", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(url, { waitUntil: "load" });
    await waitForSandboxReady(page);

    await dropTextFiles(page, [
        {
            name: "current.usda",
            path: "current.usda",
            contents: `#usda 1.0
def Xform "World"
{
    def Cube "CurrentCube"
    {
    }
}
`,
        },
    ]);
    const currentScene = await getSandboxScene(page);
    await expect.poll(async () => await currentScene.evaluate((scene) => scene.meshes.some((mesh) => mesh.name === "CurrentCube"))).toBe(true);

    await dropTextFiles(page, [
        {
            name: "First.usda",
            path: "Package/First.usda",
            contents: `#usda 1.0
def Sphere "FirstSphere"
{
}
`,
        },
        {
            name: "Second.usda",
            path: "Package/Second.usda",
            contents: `#usda 1.0
def Sphere "SecondSphere"
{
}
`,
        },
    ]);

    await expect(page.locator("#usdRootSelectionPrompt")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("#usdRootSelectionPrompt")).toBeHidden();
    await page.keyboard.press("r");
    await page.waitForTimeout(500);

    expect(await currentScene.evaluate((scene) => scene.meshes.map((mesh) => mesh.name))).toContain("CurrentCube");
    expect(await currentScene.evaluate((scene) => scene.meshes.some((mesh) => mesh.name === "FirstSphere" || mesh.name === "SecondSphere"))).toBe(false);
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

test("selecting the default camera after loading a camera from query parameters", async ({ page }) => {
    const camerasUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Cameras/glTF/Cameras.gltf";
    const query = [`assetUrl=${camerasUrl}`, "camera=0"].join("&");

    await page.goto(url + (snapshot ? "&" : "?") + query, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });

    const scene = await getSandboxScene(page);
    await scene.evaluate((scene) => {
        const defaultCamera = scene.cameras.find((camera) => camera.name === "default camera") as ArcRotateCamera | undefined;
        if (!defaultCamera) {
            throw new Error("The default camera was not found");
        }
        defaultCamera.panningSensibility = 0;
        defaultCamera.speed = 0;
    });

    await page.getByTitle("Select camera").click();
    await page.locator(".dropup-content-line", { hasText: "default camera" }).click();
    await page.getByTitle("Select camera").click();

    await expect(page.locator(".dropup-content-line", { hasText: "default camera" }).locator("div")).toHaveCSS("opacity", "1");
    await expect
        .poll(() =>
            scene.evaluate((scene) => {
                const camera = scene.activeCamera as ArcRotateCamera;
                const skybox = scene.getMeshByName("hdrSkyBox");
                const skyboxExtent = skybox?.getBoundingInfo().boundingBox.extendSizeWorld.z;
                return (
                    camera.name === "default camera" &&
                    Math.abs(camera.panningSensibility - 5000 / camera.radius) < 0.001 &&
                    Math.abs(camera.speed - camera.radius * 0.2) < 0.001 &&
                    skyboxExtent !== undefined &&
                    Math.abs(skyboxExtent - (camera.maxZ - camera.minZ) / 4) < 0.001 &&
                    camera.upperRadiusLimit !== null &&
                    skyboxExtent > camera.upperRadiusLimit &&
                    camera.keysUp.includes(87) &&
                    camera.keysDown.includes(83) &&
                    camera.keysLeft.includes(65) &&
                    camera.keysRight.includes(68)
                );
            })
        )
        .toBe(true);
});

test("moving a free camera loaded from query parameters", async ({ page }) => {
    const camerasUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Cameras/glTF/Cameras.gltf";
    const query = [`assetUrl=${camerasUrl}`, "camera=0"].join("&");

    await page.goto(url + (snapshot ? "&" : "?") + query, {
        waitUntil: "load",
    });
    await page.setViewportSize({
        width: 1920,
        height: 1080,
    });
    await waitForSandboxReady(page);
    await page.waitForSelector("#babylonjsLoadingDiv", { state: "detached" });
    await page.waitForLoadState("networkidle");

    const canvas = page.locator("#renderCanvas");
    const scene = await getSandboxScene(page);
    const getActiveCameraPosition = () => scene.evaluate((scene) => scene.activeCamera!.position.asArray());
    const cameraSpeeds = await scene.evaluate((scene) => {
        const activeCamera = scene.activeCamera as FreeCamera;
        const defaultCamera = scene.cameras.find((camera) => camera.name === "default camera") as ArcRotateCamera | undefined;
        if (!defaultCamera) {
            throw new Error("The default camera was not found");
        }
        return { active: activeCamera.speed, sceneRelative: defaultCamera.speed };
    });

    expect(cameraSpeeds.sceneRelative).not.toBeCloseTo(2);
    expect(cameraSpeeds.active).toBeCloseTo(cameraSpeeds.sceneRelative);
    const before = await getActiveCameraPosition();
    await canvas.click({ force: true });
    await page.keyboard.down("w");
    await expect
        .poll(async () => {
            const position = await getActiveCameraPosition();
            return position.every(Number.isFinite) && position.some((value, index) => value !== before[index]);
        })
        .toBe(true);
    await page.keyboard.up("w");
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
    await page.evaluate(() => document.fonts.ready);
    // check snapshot of the page
    await expect(page).toHaveScreenshot({ maxDiffPixels: 15000 });
});
