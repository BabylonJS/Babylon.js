import { expect, test, type Page } from "@playwright/test";
import {
    type AnimationManager,
    type EngineContext,
    type Mesh,
    type SceneContext,
    type StandardMaterialProps,
    type getRenderingContexts,
    type getViewProjectionMatrix,
    type isGizmoDragging,
    type isGizmoPickPending,
    type stopAnimationManager,
    type stopEngine,
    type waitForGpuResourceRetirements,
} from "@babylonjs/lite";
import { type InspectorToken } from "../../src/inspector.common";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteEngine: EngineContext;
        litePrimaryScene: SceneContext;
        liteMeshes: Mesh[];
        liteAnimationManager: AnimationManager;
        liteGetRenderingContexts: typeof getRenderingContexts;
        liteGetViewProjectionMatrix: typeof getViewProjectionMatrix;
        liteIsGizmoDragging: typeof isGizmoDragging;
        liteIsGizmoPickPending: typeof isGizmoPickPending;
        liteStopAnimationManager: typeof stopAnimationManager;
        liteStopEngine: typeof stopEngine;
        liteWaitForGpuResourceRetirements: typeof waitForGpuResourceRetirements;
        liteInspectorToken: InspectorToken;
        debugNode: object | null;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite`;
test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");
test.use({
    browserName: "chromium",
    channel: "chrome",
    viewport: { width: 1600, height: 900 },
    launchOptions: { args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])] },
});

async function OpenMesh(page: Page): Promise<void> {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteMeshes" in window);
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.liteStopAnimationManager(state.liteAnimationManager);
    });
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const nodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await nodes.click();
    await nodes.press("ArrowRight");
    await page.getByRole("treeitem", { name: "Red Box", exact: true }).click();
}

async function UtilitySceneCount(page: Page): Promise<number> {
    return page.evaluate(() => {
        const state = window as LiteTestWindow;
        return state.liteGetRenderingContexts(state.liteEngine).filter((context) => context !== state.litePrimaryScene && "meshes" in context).length;
    });
}

async function GetCanvasPoint(page: Page, target: "translation" | "rotation" | "scale" | "bounds" | "sphere"): Promise<{ x: number; y: number }> {
    // Let the layer render at least once so its public world matrices are current.
    await page.waitForFunction((target) => {
        const state = window as LiteTestWindow;
        if (target === "sphere") {
            return state.liteMeshes[1].worldMatrix[12] !== 0;
        }
        const layer = state.liteGetRenderingContexts(state.liteEngine).find((context) => context !== state.litePrimaryScene && "meshes" in context) as SceneContext | undefined;
        return layer?.meshes.some((mesh) => mesh.worldMatrix[12] !== 0);
    }, target);
    return page.evaluate((target) => {
        const state = window as LiteTestWindow;
        const scene =
            target === "sphere"
                ? state.litePrimaryScene
                : (state.liteGetRenderingContexts(state.liteEngine).find((context) => context !== state.litePrimaryScene && "meshes" in context) as SceneContext);
        const mesh =
            target === "sphere"
                ? state.liteMeshes[1]
                : scene.meshes.find((mesh) => {
                      if (target === "bounds") {
                          return mesh.name === "bbox-corner4";
                      }
                      const material = mesh.material;
                      const isStandard = (material: Mesh["material"]): material is StandardMaterialProps => "diffuseColor" in material && Array.isArray(material.diffuseColor);
                      return (
                          mesh.visible !== false &&
                          isStandard(material) &&
                          (target === "rotation"
                              ? material.diffuseColor?.[2] === 0.5 && material.diffuseColor[0] === 0
                              : material.diffuseColor?.[0] === 0.5 && material.diffuseColor[1] === 0)
                      );
                  });
        if (!mesh || !scene.camera) {
            throw new Error(`No visible ${target} target.`);
        }
        const canvas = state.liteEngine.canvas as HTMLCanvasElement;
        const matrix = state.liteGetViewProjectionMatrix(scene.camera, canvas.width / canvas.height);
        // A torus's origin is in its hole; target the blue ring away from the other axes.
        let radius = 0;
        if (target === "rotation") {
            if (!mesh.boundMax) {
                throw new Error("The rotation ring has no geometry bounds.");
            }
            radius = mesh.boundMax[0] * 0.99 * Math.SQRT1_2;
        }
        const world = mesh.worldMatrix;
        const [x, y, z] = [
            world[0] * radius + world[8] * radius + world[12],
            world[1] * radius + world[9] * radius + world[13],
            world[2] * radius + world[10] * radius + world[14],
        ];
        const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
        const ndcX = (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w;
        const ndcY = (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w;
        const rect = canvas.getBoundingClientRect();
        return { x: rect.left + ((ndcX + 1) * rect.width) / 2, y: rect.top + ((1 - ndcY) * rect.height) / 2 };
    }, target);
}

test("Lite Inspector transform modes create native gizmos, hide utility resources, and release them on deselection/disposal", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenMesh(page);
    const overlayRegion = { x: 365, y: 20, width: 400, height: 65 };
    const sceneAndTextPixels = await page.screenshot({ clip: overlayRegion });
    await expect(page.getByRole("button", { name: "Translate", exact: true })).toBeEnabled();
    for (const mode of ["Translate", "Rotate", "Scale", "Bounding Box"]) {
        await page.getByRole("button", { name: mode, exact: true }).click();
        await expect.poll(() => UtilitySceneCount(page)).toBe(1);
        await expect
            .poll(async () => (await page.screenshot({ clip: overlayRegion })).equals(sceneAndTextPixels), {
                message: "Gizmos must preserve the scene background and text overlay pixels.",
            })
            .toBe(true);
        await expect(page.getByRole("treeitem", { name: "UtilityLayer", exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name: mode, exact: true })).toHaveAttribute("aria-pressed", "true");
    }
    await page.getByRole("treeitem", { name: "Scene", exact: true }).click();
    await expect.poll(() => UtilitySceneCount(page)).toBe(0);
    await expect(page.getByRole("button", { name: "Translate", exact: true })).toBeDisabled();
    await page.getByRole("treeitem", { name: "Red Box", exact: true }).click();
    await expect.poll(() => UtilitySceneCount(page)).toBe(1);
    await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        await state.liteInspectorToken.dispose();
        state.liteStopEngine(state.liteEngine);
        await state.liteWaitForGpuResourceRetirements(state.liteEngine);
    });
    await expect.poll(() => UtilitySceneCount(page)).toBe(0);
    expect(errors).toEqual([]);
});

test("Lite Inspector translation drags mutate the selected mesh without orbiting the camera or selecting utility meshes", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenMesh(page);
    await page.getByRole("button", { name: "Enable Picking", exact: true }).click();
    await page.getByRole("button", { name: "Translate", exact: true }).click();
    await expect.poll(() => UtilitySceneCount(page)).toBe(1);
    const before = await page.evaluate(() => {
        const state = window as LiteTestWindow;
        const mesh = state.liteMeshes[0];
        return { x: mesh.position.x, camera: Array.from(state.litePrimaryScene.camera!.worldMatrix) };
    });
    const handle = await GetCanvasPoint(page, "translation");
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.waitForFunction(() => {
        const state = window as LiteTestWindow;
        return state.liteIsGizmoDragging(state.liteEngine.canvas as HTMLCanvasElement);
    });
    await page.mouse.move(handle.x + 60, handle.y, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteMeshes[0].position.x)).not.toBe(before.x);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[0])).toBe(true);
    const camera = await page.evaluate(() => Array.from((window as LiteTestWindow).litePrimaryScene.camera!.worldMatrix));
    camera.forEach((value, index) => expect(value).toBeCloseTo(before.camera[index], 5));
    const rect = await page.locator("#canvas").boundingBox();
    if (!rect) {
        throw new Error("No visible scene canvas.");
    }
    const background = { x: rect.x + rect.width / 2, y: rect.y + rect.height - 30 };
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y) === document.getElementById("canvas"), background)).toBe(true);
    await page.mouse.move(background.x, background.y);
    await page.mouse.down();
    await page.waitForFunction(() => {
        const state = window as LiteTestWindow;
        return !state.liteIsGizmoPickPending(state.liteEngine.canvas as HTMLCanvasElement);
    });
    await page.mouse.move(background.x - 40, background.y - 10, { steps: 5 });
    await page.mouse.up();
    await expect
        .poll(() =>
            page.evaluate((before) => {
                const camera = (window as LiteTestWindow).litePrimaryScene.camera!;
                return Array.from(camera.worldMatrix).some((value, index) => Math.abs(value - before[index]) > 0.0001);
            }, before.camera)
        )
        .toBe(true);
    await page.getByRole("button", { name: "Local Coordinates", exact: true }).click();
    await expect(page.getByRole("button", { name: "World Coordinates", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Translate", exact: true }).click();
    await expect.poll(() => UtilitySceneCount(page)).toBe(0);
    await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        state.liteStopEngine(state.liteEngine);
        await state.liteWaitForGpuResourceRetirements(state.liteEngine);
    });
    expect(errors).toEqual([]);
});

test("Lite Inspector rapid gizmo taps never start a drag after pointer release", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenMesh(page);
    await page.getByRole("button", { name: "Enable Picking", exact: true }).click();
    await page.getByRole("button", { name: "Translate", exact: true }).click();
    await expect.poll(() => UtilitySceneCount(page)).toBe(1);
    const handle = await GetCanvasPoint(page, "translation");
    const before = await page.evaluate(() => {
        const position = (window as LiteTestWindow).liteMeshes[0].position;
        return [position.x, position.y, position.z];
    });
    await page.mouse.click(handle.x, handle.y);
    await page.waitForFunction(() => {
        const state = window as LiteTestWindow;
        return !state.liteIsGizmoPickPending(state.liteEngine.canvas as HTMLCanvasElement);
    });
    expect(await page.evaluate(() => (window as LiteTestWindow).liteIsGizmoDragging((window as LiteTestWindow).liteEngine.canvas as HTMLCanvasElement))).toBe(false);
    await page.mouse.move(handle.x + 40, handle.y, { steps: 5 });
    expect(
        await page.evaluate(() => {
            const position = (window as LiteTestWindow).liteMeshes[0].position;
            return [position.x, position.y, position.z];
        })
    ).toEqual(before);
    expect(await page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[0])).toBe(true);
    await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        await state.liteInspectorToken.dispose();
        state.liteStopEngine(state.liteEngine);
        await state.liteWaitForGpuResourceRetirements(state.liteEngine);
    });
    expect(errors).toEqual([]);
});

for (const [mode, target, property, dx, dy] of [
    ["Translate", "translation", "position", 80, 0],
    ["Rotate", "rotation", "rotationQuaternion", 0, -80],
    ["Scale", "scale", "scaling", 80, 0],
    ["Bounding Box", "bounds", "scaling", 40, 40],
] as const) {
    test(`Lite Inspector ordinary ${mode.toLowerCase()} drags work without waiting for handle picking`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await OpenMesh(page);
        await page.getByRole("button", { name: "Enable Picking", exact: true }).click();
        await page.getByRole("button", { name: mode, exact: true }).click();
        await expect.poll(() => UtilitySceneCount(page)).toBe(1);
        const handle = await GetCanvasPoint(page, target);
        const readTransform = () =>
            page.evaluate((property) => {
                const value = (window as LiteTestWindow).liteMeshes[0][property];
                return [value.x, value.y, value.z];
            }, property);
        const before = { transform: await readTransform(), camera: await page.evaluate(() => Array.from((window as LiteTestWindow).litePrimaryScene.camera!.worldMatrix)) };
        await page.mouse.move(handle.x, handle.y);
        await page.mouse.down();
        expect(await page.evaluate(() => (window as LiteTestWindow).liteIsGizmoDragging((window as LiteTestWindow).liteEngine.canvas as HTMLCanvasElement))).toBe(true);
        await page.mouse.move(handle.x + dx, handle.y + dy, { steps: 5 });
        expect(await readTransform()).not.toEqual(before.transform);
        await page.mouse.up();
        expect(await page.evaluate(() => (window as LiteTestWindow).liteIsGizmoDragging((window as LiteTestWindow).liteEngine.canvas as HTMLCanvasElement))).toBe(false);
        expect(await page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[0])).toBe(true);
        const camera = await page.evaluate(() => Array.from((window as LiteTestWindow).litePrimaryScene.camera!.worldMatrix));
        camera.forEach((value, index) => expect(value).toBeCloseTo(before.camera[index], 5));
        await page.evaluate(async () => {
            const state = window as LiteTestWindow;
            await state.liteInspectorToken.dispose();
            state.liteStopEngine(state.liteEngine);
            await state.liteWaitForGpuResourceRetirements(state.liteEngine);
        });
        expect(errors).toEqual([]);
    });
}

test("Lite Inspector scaling stays local on a rotated mesh after using world-coordinate translation", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenMesh(page);
    await page.evaluate(() => {
        const mesh = (window as LiteTestWindow).liteMeshes[0];
        mesh.rotationQuaternion.set(0, 0, Math.SQRT1_2, Math.SQRT1_2);
    });
    await page.getByRole("button", { name: "Translate", exact: true }).click();
    await page.getByRole("button", { name: "Local Coordinates", exact: true }).click();
    await page.getByRole("button", { name: "Scale", exact: true }).click();
    await expect(page.getByRole("button", { name: "World Coordinates", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Local Coordinates", exact: true })).toBeHidden();
    const handle = await GetCanvasPoint(page, "scale");
    const before = await page.evaluate(() => {
        const scaling = (window as LiteTestWindow).liteMeshes[0].scaling;
        return [scaling.x, scaling.y, scaling.z];
    });
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    expect(await page.evaluate(() => (window as LiteTestWindow).liteIsGizmoDragging((window as LiteTestWindow).liteEngine.canvas as HTMLCanvasElement))).toBe(true);
    await page.mouse.move(handle.x, handle.y - 60, { steps: 5 });
    const after = await page.evaluate(() => {
        const scaling = (window as LiteTestWindow).liteMeshes[0].scaling;
        return [scaling.x, scaling.y, scaling.z];
    });
    expect(after[0]).not.toBeCloseTo(before[0], 5);
    expect(after[1]).toBeCloseTo(before[1], 5);
    expect(after[2]).toBeCloseTo(before[2], 5);
    await page.mouse.up();
    await page.getByRole("button", { name: "Rotate", exact: true }).click();
    await expect(page.getByRole("button", { name: "World Coordinates", exact: true })).toBeVisible();
    await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        await state.liteInspectorToken.dispose();
        state.liteStopEngine(state.liteEngine);
        await state.liteWaitForGpuResourceRetirements(state.liteEngine);
    });
    expect(errors).toEqual([]);
});

test("Lite Inspector canvas picking still switches meshes while a gizmo mode is active", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenMesh(page);
    await page.getByRole("button", { name: "Enable Picking", exact: true }).click();
    await page.getByRole("button", { name: "Translate", exact: true }).click();
    await expect.poll(() => UtilitySceneCount(page)).toBe(1);
    const sphere = await GetCanvasPoint(page, "sphere");
    await page.mouse.click(sphere.x, sphere.y);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[1])).toBe(true);
    await expect(page.getByRole("button", { name: "Translate", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.waitForFunction(() => {
        const state = window as LiteTestWindow;
        const layer = state.liteGetRenderingContexts(state.liteEngine).find((context) => context !== state.litePrimaryScene && "meshes" in context) as SceneContext | undefined;
        return layer?.meshes.some((mesh) => mesh.worldMatrix[12] === state.liteMeshes[1].worldMatrix[12]);
    });
    const handle = await GetCanvasPoint(page, "translation");
    const before = await page.evaluate(() => (window as LiteTestWindow).liteMeshes[1].position.x);
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    expect(await page.evaluate(() => (window as LiteTestWindow).liteIsGizmoDragging((window as LiteTestWindow).liteEngine.canvas as HTMLCanvasElement))).toBe(true);
    await page.mouse.move(handle.x + 40, handle.y, { steps: 5 });
    expect(await page.evaluate(() => (window as LiteTestWindow).liteMeshes[1].position.x)).not.toBe(before);
    await page.mouse.up();
    await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        await state.liteInspectorToken.dispose();
        state.liteStopEngine(state.liteEngine);
        await state.liteWaitForGpuResourceRetirements(state.liteEngine);
    });
    expect(errors).toEqual([]);
});
