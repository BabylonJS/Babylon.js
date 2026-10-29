import { expect, test, type Page } from "@playwright/test";

import { type CreateLitePhysicsFixture } from "../app/litePhysics";

type LitePhysicsWindow = Window &
    typeof globalThis & {
        liteCreatePhysics: () => Promise<void>;
        litePhysics: Awaited<ReturnType<typeof CreateLitePhysicsFixture>>;
        debugNode: object | null;
    };
const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite`;
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
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBe(4);
    await page.getByRole("switch", { name: "Physics Constraints", exact: true }).check();
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBeGreaterThan(4);
    await page.evaluate(() => (window as LitePhysicsWindow).litePhysics.removeEndpoint());
    await expect(hinge).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).debugNode)).toBeNull();
    const distance = page.getByRole("treeitem", { name: "Distance (P10 Box ↔ P10 Shared)", exact: true });
    await expect(distance).toBeVisible();
    await page.evaluate(() => (window as LitePhysicsWindow).litePhysics.releaseDistance());
    await expect(distance).toHaveCount(0);
    // Constraint-only reconciliation must leave the remaining three body helpers intact.
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBe(3);
    await expect(page.getByRole("switch", { name: "Physics Bodies", exact: true })).toBeChecked();
    await page.evaluate(() => (window as LitePhysicsWindow).litePhysics.dispose());
    await expect(page.getByRole("treeitem", { name: "Physics", exact: true })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LitePhysicsWindow).litePhysics.helperCount())).toBe(0);
    await expect(page.getByRole("switch", { name: "Physics Bodies", exact: true })).toBeDisabled();
    await expect(page.getByRole("switch", { name: "Physics Constraints", exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
});
