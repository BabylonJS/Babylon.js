import { expect, test, type Page } from "@playwright/test";
import { type EngineContext, type SceneContext, type getViewProjectionMatrix } from "@babylonjs/lite";

import { type CreateLitePhysicsFixture } from "../app/litePhysics";

type LitePhysicsWindow = Window &
    typeof globalThis & {
        liteCreatePhysics: () => Promise<void>;
        litePhysics: Awaited<ReturnType<typeof CreateLitePhysicsFixture>>;
        liteEngine: EngineContext;
        litePrimaryScene: SceneContext;
        liteGetViewProjectionMatrix: typeof getViewProjectionMatrix;
        debugNode: object | null;
    };
const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite&physics=off`;
test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");
test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: { args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])] },
});

async function Expand(page: Page, name: string) {
    const item = page.getByRole("treeitem", { name, exact: true });
    await item.click();
    await item.press("ArrowRight");
}

async function OpenPhysics(page: Page) {
    await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204 }));
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteCreatePhysics" in window);
    await Expand(page, "Scene");
    await expect(page.getByRole("treeitem", { name: "Physics", exact: true })).toHaveCount(0);
    // The async Havok load deliberately happens after the Inspector is mounted.
    await page.evaluate(() => (window as LitePhysicsWindow).liteCreatePhysics());
    await Expand(page, "Physics");
    await Expand(page, "Physics World [0]");
    await Expand(page, "Bodies");
}

async function EditNumber(page: Page, label: string, value: string) {
    const row = page.getByText(label, { exact: true }).last().locator("xpath=ancestor::div[.//input][1]");
    await row.getByRole("textbox").fill(value);
    await row.getByRole("textbox").press("Enter");
}

async function EditVectorComponent(page: Page, label: string, axis: string, value: string) {
    const row = page.getByText(label, { exact: true }).last().locator("xpath=ancestor::div[.//button[@aria-label='Expand/Collapse property']][1]");
    await row.getByRole("button", { name: "Expand/Collapse property", exact: true }).click();
    await EditNumber(page, axis, value);
    await row.getByRole("button", { name: "Expand/Collapse property", exact: true }).click();
}

function WatchPhysicsErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
        const text = message.text();
        // React 18 warns about Fluent's inert attribute during shared Collapse
        // transitions. This pre-existing development-only warning is not a physics error.
        const fluentInertWarning = text.startsWith("Warning: Received `%s` for a non-boolean attribute `%s`.") && text.includes("true inert inert true inert");
        if (message.type() === "error" && !fluentInertWarning) {
            errors.push(text);
        }
    });
    return errors;
}

test("Lite physics test fixture loads by default and is created only once", async ({ page }) => {
    const errors = WatchPhysicsErrors(page);
    await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204 }));
    await page.goto(TestUrl.replace("&physics=off", ""));
    await page.waitForFunction(() => "litePhysics" in window);
    const counts = () =>
        page.evaluate(() => {
            const physics = (window as LitePhysicsWindow).litePhysics;
            return [physics.worldCount(), physics.bodyCount()];
        });
    expect(await counts()).toEqual([1, 4]);
    await Expand(page, "Scene");
    await expect(page.getByRole("treeitem", { name: "Physics", exact: true })).toBeVisible();
    await page.evaluate(() => Promise.all([(window as LitePhysicsWindow).liteCreatePhysics(), (window as LitePhysicsWindow).liteCreatePhysics()]));
    expect(await counts()).toEqual([1, 4]);
    expect(errors).toEqual([]);
});

test("Lite physics debug helpers stay finite and in view during manual inspection", async ({ page }) => {
    const errors = WatchPhysicsErrors(page);
    await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204 }));
    await page.goto(TestUrl.replace("&physics=off", ""));
    await page.waitForFunction(() => "litePhysics" in window);
    await page.locator('[role="radio"][value="Debug"]').click();
    await page.getByRole("switch", { name: "Physics Bodies", exact: true }).check();
    await page.getByRole("switch", { name: "Physics Constraints", exact: true }).check();
    const readView = () =>
        page.evaluate(() => {
            const state = window as LitePhysicsWindow;
            const scene = state.litePrimaryScene;
            const canvas = state.liteEngine.canvas;
            const viewProjection = state.liteGetViewProjectionMatrix(scene.camera!, canvas.width / canvas.height);
            const helpers = scene.meshes.filter((mesh) => mesh.name === "physicsBodyDebug" || mesh.name.startsWith("constraint"));
            const outsideView = helpers.filter((mesh) => {
                if (!mesh.boundMin || !mesh.boundMax || mesh.visible === false) {
                    return true;
                }
                const world = mesh.worldMatrix;
                for (let corner = 0; corner < 8; corner++) {
                    const x = (corner & 1 ? mesh.boundMax : mesh.boundMin)[0];
                    const y = (corner & 2 ? mesh.boundMax : mesh.boundMin)[1];
                    const z = (corner & 4 ? mesh.boundMax : mesh.boundMin)[2];
                    const wx = world[0] * x + world[4] * y + world[8] * z + world[12];
                    const wy = world[1] * x + world[5] * y + world[9] * z + world[13];
                    const wz = world[2] * x + world[6] * y + world[10] * z + world[14];
                    const w = viewProjection[3] * wx + viewProjection[7] * wy + viewProjection[11] * wz + viewProjection[15];
                    const clipX = viewProjection[0] * wx + viewProjection[4] * wy + viewProjection[8] * wz + viewProjection[12];
                    const clipY = viewProjection[1] * wx + viewProjection[5] * wy + viewProjection[9] * wz + viewProjection[13];
                    const clipZ = viewProjection[2] * wx + viewProjection[6] * wy + viewProjection[10] * wz + viewProjection[14];
                    if (![wx, wy, wz, w, clipX, clipY, clipZ].every(Number.isFinite) || w <= 0 || Math.abs(clipX) > w || Math.abs(clipY) > w || clipZ < 0 || clipZ > w) {
                        return true;
                    }
                }
                return false;
            });
            return {
                bodyHelpers: helpers.filter((mesh) => mesh.name === "physicsBodyDebug").length,
                constraintHelpers: helpers.filter((mesh) => mesh.name.startsWith("constraint")).length,
                outsideView: outsideView.map((mesh) => mesh.name),
                visibleSources: state.litePhysics.bodies.slice(0, 3).every((body) => "material" in body.node && !!body.node.material),
                positions: state.litePhysics.bodies.slice(0, 3).map((body) => [body.node.position.x, body.node.position.y, body.node.position.z]),
            };
        });
    const initial = await readView();
    expect(initial.bodyHelpers).toBe(3); // Thin-instance carrier wireframes remain omitted.
    expect(initial.constraintHelpers).toBeGreaterThan(0);
    expect(initial.visibleSources).toBe(true);
    expect(initial.outsideView).toEqual([]);
    // The previous overlapping fixture had already left the fixed camera after one second.
    await page.waitForTimeout(5000);
    const later = await readView();
    expect(later.bodyHelpers).toBe(3);
    expect(later.constraintHelpers).toBe(initial.constraintHelpers);
    expect(later.outsideView).toEqual([]);
    later.positions.forEach((position, body) => position.forEach((value, axis) => expect(value).toBeCloseTo(initial.positions[body][axis], 2)));
    expect(errors).toEqual([]);
});

test("Lite physics discovers async worlds and exposes Inspector body parity, shared shapes and thin fan-out editing", async ({ page }) => {
    const errors = WatchPhysicsErrors(page);
    await OpenPhysics(page);
    await page.getByRole("treeitem", { name: "P10 Box (Body)", exact: true }).click();
    for (const label of [
        "Motion Type",
        "Prestep Type",
        "Type",
        "Dynamic Friction",
        "Static Friction",
        "Restitution",
        "Linear Damping",
        "Angular Damping",
        "Gravity Factor",
        "Linear Velocity",
        "Angular Velocity",
        "Mass",
        "Center of Mass",
        "Inertia",
        "Inertia Orientation",
    ]) {
        await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
    }
    await expect(page.getByText(/Shape shared by 2 bodies/)).toBeVisible();
    await EditNumber(page, "Dynamic Friction", "0.65");
    await EditNumber(page, "Mass", "5");
    await expect
        .poll(() =>
            page.evaluate(() => {
                const values = (window as LitePhysicsWindow).litePhysics.read();
                return [Math.round(values.friction * 100), values.mass];
            })
        )
        .toEqual([65, 5]);
    await page.getByRole("treeitem", { name: "P10 Thin (Body) ×3", exact: true }).click();
    await expect(page.getByText("Instance 0 of 3", { exact: true })).toBeVisible();
    await EditNumber(page, "Mass", "3");
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.read().thinMasses)).toEqual([3, 3, 3]);
    expect(errors).toEqual([]);
});

test("Lite constraints expose frames/limits, hide removed endpoints and release selection; independent debug helpers survive disposal", async ({ page }) => {
    const errors = WatchPhysicsErrors(page);
    await OpenPhysics(page);
    await Expand(page, "Constraints");
    const hinge = page.getByRole("treeitem", { name: "Hinge (P10 Box ↔ P10 Sphere)", exact: true });
    await hinge.click();
    for (const label of ["Body A", "Body B", "Enabled", "Collision", "Pivot A", "Pivot B", "Axis A", "Perp Axis B", "Angular X"]) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await page.locator('[role="radio"][value="Debug"]').click();
    await page.getByRole("switch", { name: "Physics Bodies", exact: true }).check();
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBe(3);
    await expect(page.getByText("Thin-instance body wireframes are omitted", { exact: false })).toBeVisible();
    await page.getByRole("switch", { name: "Physics Constraints", exact: true }).check();
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBeGreaterThan(3);
    await page.evaluate(() => (window as LitePhysicsWindow).litePhysics.removeEndpoint());
    await expect(hinge).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).debugNode)).toBeNull();
    const distance = page.getByRole("treeitem", { name: "Distance (P10 Box ↔ P10 Shared)", exact: true });
    await expect(distance).toBeVisible();
    await page.evaluate(() => (window as LitePhysicsWindow).litePhysics.releaseDistance());
    await expect(distance).toHaveCount(0);
    // Constraint-only reconciliation leaves the two ordinary body helpers intact.
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBe(2);
    await expect(page.getByRole("switch", { name: "Physics Bodies", exact: true })).toBeChecked();
    await page.evaluate(() => (window as LitePhysicsWindow).litePhysics.dispose());
    await expect(page.getByRole("treeitem", { name: "Physics", exact: true })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBe(0);
    await expect(page.getByRole("switch", { name: "Physics Bodies", exact: true })).toBeDisabled();
    await expect(page.getByRole("switch", { name: "Physics Constraints", exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
});

for (const thinBody of [false, true]) {
    test(`Lite sequential mass edits preserve current unedited properties and rotation locks (${thinBody ? "thin instances" : "ordinary body"})`, async ({ page }) => {
        const errors = WatchPhysicsErrors(page);
        await OpenPhysics(page);
        await page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.prepareMassEdits(thin), thinBody);
        await page.getByRole("treeitem", { name: thinBody ? "P10 Thin (Body) ×3" : "P10 Box (Body)", exact: true }).click();
        await EditNumber(page, "Mass", "7");
        await EditVectorComponent(page, "Center of Mass", "X", "8");
        await EditVectorComponent(page, "Inertia", "Y", "12");
        await expect
            .poll(() => page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.readMassProperties(thin), thinBody))
            .toEqual(
                Array.from({ length: thinBody ? 3 : 1 }, () => ({
                    mass: 7,
                    centerOfMass: { x: 8, y: 2, z: 3 },
                    inertia: { x: 3, y: 12, z: 5 },
                    inertiaOrientation: { x: 0, y: 0, z: 0, w: 1 },
                }))
            );
        await page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.lockMassEdits(thin), thinBody);
        const locked = await page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.readMassProperties(thin), thinBody);
        expect(locked.every((properties) => properties.inertia.x === 0)).toBe(true);
        await EditNumber(page, "Mass", "99");
        await expect(page.getByText("Cannot safely edit mass properties with zero inertia", { exact: false })).toBeVisible();
        const massInput = page.getByText("Mass", { exact: true }).last().locator("xpath=ancestor::div[.//input][1]").getByRole("textbox");
        await expect(massInput).toHaveValue("7");
        expect(await page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.readMassProperties(thin), thinBody)).toEqual(locked);
        await page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.unlockMassEdits(thin), thinBody);
        const unlocked = await page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.readMassProperties(thin), thinBody);
        expect(unlocked.every((properties) => properties.mass === 7 && properties.inertia.x === 3 && properties.inertia.y === 12)).toBe(true);
        await EditNumber(page, "Mass", "99");
        await expect(massInput).toHaveValue("99");
        await expect
            .poll(() => page.evaluate((thin) => (window as LitePhysicsWindow).litePhysics.readMassProperties(thin), thinBody))
            .toEqual(unlocked.map((properties) => ({ ...properties, mass: 99 })));
        await expect(page.getByText("Cannot safely edit mass properties with zero inertia", { exact: false })).toHaveCount(0);
        expect(errors).toEqual([]);
    });
}
