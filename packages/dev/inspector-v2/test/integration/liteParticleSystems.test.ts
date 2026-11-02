import { expect, test, type Page } from "@playwright/test";
import { type ParticleSystem, type SceneContext } from "@babylonjs/lite";

type LiteTestWindow = Window &
    typeof globalThis & {
        litePrimaryScene: SceneContext;
        liteGetParticleSystems: (scene: SceneContext) => readonly ParticleSystem[];
        liteIsParticleSystemStarted: (system: ParticleSystem) => boolean;
        liteRegisterSecondParticleSet: () => Promise<void>;
        liteDisposeScene: (scene: SceneContext) => void;
        debugNode: object | null;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite`;
test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");
test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: { args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])] },
});

async function OpenParticles(page: Page) {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteGetParticleSystems" in window);
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const section = page.getByRole("treeitem", { name: "Particle Systems", exact: true });
    await section.click();
    await section.press("ArrowRight");
}

async function IsStarted(page: Page) {
    return await page.evaluate(() => {
        const state = window as LiteTestWindow;
        return state.liteIsParticleSystemStarted(state.liteGetParticleSystems(state.litePrimaryScene)[0]);
    });
}

test("Lite Inspector CPU particles expose running state, start/stop and supported emission edits", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenParticles(page);
    const system = page.getByRole("treeitem", { name: /^P9 Sparks/ });
    await system.click();
    for (const label of ["Capacity", "Active Particles", "Started"]) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect.poll(() => IsStarted(page)).toBe(true);
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect.poll(() => IsStarted(page)).toBe(false);
    await system.hover();
    await system.getByRole("button", { name: "Start/Stop Particle System", exact: true }).click();
    await expect.poll(() => IsStarted(page)).toBe(true);
    for (const [label, value] of [
        ["Emit Rate", "25"],
        ["Update Speed", "0.02"],
        ["Target Stop Duration", "4"],
    ]) {
        const row = page.getByText(label, { exact: true }).locator("xpath=ancestor::div[.//input][1]");
        await row.getByRole("textbox").fill(value);
        await row.getByRole("textbox").press("Enter");
    }
    await expect
        .poll(() =>
            page.evaluate(() => {
                const state = window as LiteTestWindow;
                const system = state.liteGetParticleSystems(state.litePrimaryScene)[0];
                return [system.emitRate, system.updateSpeed, system.targetStopDuration];
            })
        )
        .toEqual([25, 0.02, 4]);
    expect(errors).toEqual([]);
});

test("Lite Inspector discovers later particle registration and clears particle selection on scene disposal", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenParticles(page);
    await page.evaluate(() => (window as LiteTestWindow).liteRegisterSecondParticleSet());
    const second = page.getByRole("treeitem", { name: /^P9 Second Sparks/ });
    await expect(second).toBeVisible();
    await second.click();
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.liteDisposeScene(state.litePrimaryScene);
    });
    await expect(second).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode)).toBeNull();
    await expect
        .poll(() =>
            page.evaluate(() => {
                const state = window as LiteTestWindow;
                return state.liteGetParticleSystems(state.litePrimaryScene).length;
            })
        )
        .toBe(0);
    expect(errors).toEqual([]);
});
