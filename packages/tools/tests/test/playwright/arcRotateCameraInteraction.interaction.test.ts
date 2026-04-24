import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization, evaluatePrepareScene, evaluateRenderSceneForVisualization } from "./visualizationPlaywright.utils";

/**
 * Interaction tests for ArcRotateCamera input handling.
 *
 * These tests verify that pointer drags, mouse wheel, and keyboard arrows
 * produce the expected camera state changes through the full input pipeline
 * (DOM event → input class → InputMapper → movement system → camera update).
 *
 * Inertia is disabled so that camera state is deterministic after a fixed
 * number of render frames, regardless of timing.
 */

let page: Page;

// Minimal scene code shared by all tests. Creates an ArcRotateCamera with
// inertia disabled and control attached, plus simple geometry for visual reference.
const SCENE_CODE = `
var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera(
        "camera", -Math.PI / 2, Math.PI / 2.5, 10,
        new BABYLON.Vector3(0, 0, 0), scene
    );
    camera.inertia = 0;
    camera.panningInertia = 0;
    camera.angularSensibilityX = 500;
    camera.angularSensibilityY = 500;
    camera.panningSensibility = 50;
    camera.wheelPrecision = 50;
    camera.attachControl(canvas, true);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
    var gmat = new BABYLON.StandardMaterial("gm", scene);
    gmat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    ground.material = gmat;

    var box = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scene);
    box.position.y = 1;
    var bmat = new BABYLON.StandardMaterial("bm", scene);
    bmat.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0.3);
    box.material = bmat;

    return scene;
};
`;

test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
        timeout: 0,
    });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
    await page.waitForFunction(() => {
        return window.BABYLON;
    });
    page.setDefaultTimeout(0);
    await page.setViewportSize({ width: 800, height: 600 });
});

test.afterAll(async () => {
    await page.close();
});

test.beforeEach(async () => {
    await page.evaluate(() => {
        if (window.scene && window.scene.dispose) {
            window.scene.dispose();
            window.scene = null;
            window.engine && window.engine.dispose();
            window.engine = null;
        }
    });

    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgl1",
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl: getGlobalConfig().baseUrl,
    });
});

test.afterEach(async () => {
    await page.evaluate(() => {
        window.engine && window.engine.dispose();
        window.scene = null;
        window.engine = null;
    });
});

/** Helper: load the shared scene and start the render loop, keeping it running for interaction. */
async function loadSceneAndStartRendering(renderCount: number) {
    await page.evaluate(evaluatePrepareScene, {
        sceneMetadata: { playgroundId: "#DUMMY#0", snippetCode: SCENE_CODE, snippetSceneCall: "createScene(engine)" },
        globalConfig: getGlobalConfig(),
    });
    // Suppress the context menu to avoid interference with right-click drags
    await page.evaluate(() => {
        document.querySelector("#babylon-canvas")!.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    return page.evaluate(evaluateRenderSceneForVisualization, { renderCount, continueRenderingOnDone: false });
}

/** Helper: read the active ArcRotateCamera state from the page. */
async function getCameraState(): Promise<{ alpha: number; beta: number; radius: number; targetX: number; targetY: number; targetZ: number }> {
    return page.evaluate(() => {
        const cam = window.scene!.activeCamera! as any;
        return {
            alpha: cam.alpha,
            beta: cam.beta,
            radius: cam.radius,
            targetX: cam.target.x,
            targetY: cam.target.y,
            targetZ: cam.target.z,
        };
    });
}

/** Helper: get the center of the canvas bounding box. */
async function getCanvasCenter(): Promise<{ x: number; y: number; width: number; height: number }> {
    const box = await page.locator("#babylon-canvas").boundingBox();
    if (!box) {
        throw new Error("Canvas element not found");
    }
    return box;
}

const EPSILON = 0.001;

// ── Pointer drag: rotation ──────────────────────────────────────────

test("left-drag rotates camera (alpha changes, radius and target unchanged)", async () => {
    const rendering = loadSceneAndStartRendering(100);
    const canvas = await getCanvasCenter();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;

    // Let the scene initialize for a few frames
    await page.waitForTimeout(200);
    const before = await getCameraState();

    // Left-drag horizontally to rotate alpha
    await page.mouse.move(cx, cy, { steps: 5 });
    await page.mouse.down({ button: "left" });
    await page.mouse.move(cx + 150, cy, { steps: 20 });
    await page.mouse.up({ button: "left" });

    // Let remaining frames render
    await rendering;
    const after = await getCameraState();

    // Alpha should have changed from the horizontal drag
    expect(Math.abs(after.alpha - before.alpha)).toBeGreaterThan(0.05);
    // Radius should be unchanged (no zoom)
    expect(Math.abs(after.radius - before.radius)).toBeLessThan(EPSILON);
    // Target should be unchanged (no pan)
    expect(Math.abs(after.targetX - before.targetX)).toBeLessThan(EPSILON);
    expect(Math.abs(after.targetY - before.targetY)).toBeLessThan(EPSILON);
    expect(Math.abs(after.targetZ - before.targetZ)).toBeLessThan(EPSILON);
});

test("left-drag vertically rotates camera (beta changes)", async () => {
    const rendering = loadSceneAndStartRendering(100);
    const canvas = await getCanvasCenter();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;

    await page.waitForTimeout(200);
    const before = await getCameraState();

    // Left-drag vertically to rotate beta
    await page.mouse.move(cx, cy, { steps: 5 });
    await page.mouse.down({ button: "left" });
    await page.mouse.move(cx, cy - 100, { steps: 20 });
    await page.mouse.up({ button: "left" });

    await rendering;
    const after = await getCameraState();

    // Beta should have changed from the vertical drag
    expect(Math.abs(after.beta - before.beta)).toBeGreaterThan(0.05);
    // Radius and target should be unchanged
    expect(Math.abs(after.radius - before.radius)).toBeLessThan(EPSILON);
    expect(Math.abs(after.targetX - before.targetX)).toBeLessThan(EPSILON);
    expect(Math.abs(after.targetZ - before.targetZ)).toBeLessThan(EPSILON);
});

// ── Pointer drag: panning ───────────────────────────────────────────

test("right-drag pans camera (target changes, alpha/beta/radius unchanged)", async () => {
    const rendering = loadSceneAndStartRendering(100);
    const canvas = await getCanvasCenter();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;

    await page.waitForTimeout(200);
    const before = await getCameraState();

    // Right-drag to pan
    await page.mouse.move(cx, cy, { steps: 5 });
    await page.mouse.down({ button: "right" });
    await page.mouse.move(cx + 100, cy + 50, { steps: 20 });
    await page.mouse.up({ button: "right" });

    await rendering;
    const after = await getCameraState();

    // Target should have changed (panning moves the target)
    const targetDelta = Math.sqrt(
        (after.targetX - before.targetX) ** 2 + (after.targetY - before.targetY) ** 2 + (after.targetZ - before.targetZ) ** 2
    );
    expect(targetDelta).toBeGreaterThan(0.01);
    // Alpha, beta, radius should be unchanged
    expect(Math.abs(after.alpha - before.alpha)).toBeLessThan(EPSILON);
    expect(Math.abs(after.beta - before.beta)).toBeLessThan(EPSILON);
    expect(Math.abs(after.radius - before.radius)).toBeLessThan(EPSILON);
});

test("ctrl+left-drag pans camera (useCtrlForPanning behavior)", async () => {
    const rendering = loadSceneAndStartRendering(100);
    const canvas = await getCanvasCenter();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;

    await page.waitForTimeout(200);
    const before = await getCameraState();

    // Ctrl+left-drag should pan, not rotate
    await page.mouse.move(cx, cy, { steps: 5 });
    await page.keyboard.down("Control");
    await page.mouse.down({ button: "left" });
    await page.mouse.move(cx + 100, cy + 50, { steps: 20 });
    await page.mouse.up({ button: "left" });
    await page.keyboard.up("Control");

    await rendering;
    const after = await getCameraState();

    // Target should have changed (panning)
    const targetDelta = Math.sqrt(
        (after.targetX - before.targetX) ** 2 + (after.targetY - before.targetY) ** 2 + (after.targetZ - before.targetZ) ** 2
    );
    expect(targetDelta).toBeGreaterThan(0.01);
    // Alpha and beta should be unchanged (no rotation)
    expect(Math.abs(after.alpha - before.alpha)).toBeLessThan(EPSILON);
    expect(Math.abs(after.beta - before.beta)).toBeLessThan(EPSILON);
});

// ── Mouse wheel: zoom ───────────────────────────────────────────────

test("mouse wheel zooms camera (radius changes, alpha/beta/target unchanged)", async () => {
    const rendering = loadSceneAndStartRendering(100);
    const canvas = await getCanvasCenter();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;

    await page.waitForTimeout(200);
    const before = await getCameraState();

    // Wheel scroll to zoom in
    await page.mouse.move(cx, cy, { steps: 5 });
    await page.mouse.wheel(0, -200);

    await rendering;
    const after = await getCameraState();

    // Radius should have decreased (zoomed in)
    expect(after.radius).toBeLessThan(before.radius - 0.01);
    // Alpha, beta, target should be unchanged
    expect(Math.abs(after.alpha - before.alpha)).toBeLessThan(EPSILON);
    expect(Math.abs(after.beta - before.beta)).toBeLessThan(EPSILON);
    expect(Math.abs(after.targetX - before.targetX)).toBeLessThan(EPSILON);
    expect(Math.abs(after.targetZ - before.targetZ)).toBeLessThan(EPSILON);
});

// ── Keyboard: rotation ──────────────────────────────────────────────

test("arrow keys rotate camera", async () => {
    const rendering = loadSceneAndStartRendering(100);
    const canvas = await getCanvasCenter();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;

    // Click to focus the canvas so keyboard events are captured
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(200);
    const before = await getCameraState();

    // Press ArrowRight to rotate alpha
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.up("ArrowRight");

    await rendering;
    const after = await getCameraState();

    // Alpha should have changed
    expect(Math.abs(after.alpha - before.alpha)).toBeGreaterThan(0.01);
    // Radius should be unchanged
    expect(Math.abs(after.radius - before.radius)).toBeLessThan(EPSILON);
});

// ── Keyboard: ctrl+arrow panning ────────────────────────────────────

test("ctrl+arrow keys pan camera (not rotate)", async () => {
    const rendering = loadSceneAndStartRendering(100);
    const canvas = await getCanvasCenter();
    const cx = canvas.x + canvas.width / 2;
    const cy = canvas.y + canvas.height / 2;

    // Click to focus the canvas
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(200);
    const before = await getCameraState();

    // Ctrl+ArrowRight should pan, not rotate
    await page.keyboard.down("Control");
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.up("ArrowRight");
    await page.keyboard.up("Control");

    await rendering;
    const after = await getCameraState();

    // Target should have changed (panning)
    const targetDelta = Math.sqrt(
        (after.targetX - before.targetX) ** 2 + (after.targetY - before.targetY) ** 2 + (after.targetZ - before.targetZ) ** 2
    );
    expect(targetDelta).toBeGreaterThan(0.001);
    // Alpha and beta should be unchanged (no rotation from ctrl+arrow)
    expect(Math.abs(after.alpha - before.alpha)).toBeLessThan(EPSILON);
    expect(Math.abs(after.beta - before.beta)).toBeLessThan(EPSILON);
});
