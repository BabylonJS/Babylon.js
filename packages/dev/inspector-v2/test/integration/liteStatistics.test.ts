import { expect, test, type Page } from "@playwright/test";
import { type EngineContext, type RenderTaskGpuTimings } from "@babylonjs/lite";
import { type InspectorToken } from "../../src/inspector.common";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteEngine: EngineContext;
        liteInspectorToken: InspectorToken;
        liteGetRenderTaskGpuTimings: (engine: EngineContext) => RenderTaskGpuTimings;
        liteSetRenderTaskGpuTimingEnabled: (engine: EngineContext, enabled: boolean) => Promise<RenderTaskGpuTimings>;
        liteShowInspector: (engine: EngineContext) => InspectorToken;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite`;

test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to the running Inspector test app.");
test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: {
        args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])],
    },
});

async function OpenStatistics(page: Page) {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteInspectorToken" in window);
    await page.locator('[role="radio"][value="Statistics"]').click();
}

async function ReadTimings(page: Page): Promise<RenderTaskGpuTimings> {
    return await page.evaluate(() => {
        const state = window as LiteTestWindow;
        return state.liteGetRenderTaskGpuTimings(state.liteEngine);
    });
}

test("Lite Inspector statistics show engine-wide counts, system info, and opt-in GPU timings", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenStatistics(page);
    await expect(page.getByText("Total Meshes", { exact: true })).toBeVisible();
    await expect(page.getByText("Primary Surface", { exact: true })).toBeVisible();
    await expect(page.getByText("Surface 2", { exact: true })).toBeVisible();
    await expect(page.getByText("Babylon Lite (WebGPU)", { exact: true })).toBeVisible();
    for (const [label, value] of [
        ["Total Meshes", 3],
        ["Total Lights", 4],
        ["Scene Materials", 2],
        ["Scene Textures", 2],
        ["Surfaces", 2],
    ] as const) {
        const row = page.getByText(label, { exact: true }).locator("xpath=ancestor::div[div[@id='property']][1]");
        await expect(row).toHaveText(new RegExp(`${label}\\s*${value}`));
    }
    const initial = await ReadTimings(page);
    expect(initial.enabled).toBe(false);
    const toggle = page.getByRole("switch");
    if (!initial.supported) {
        await expect(toggle).toBeDisabled();
        await expect(page.getByText("This WebGPU device does not support timestamp queries.", { exact: true })).toBeVisible();
    } else {
        await toggle.click();
        await expect.poll(async () => (await ReadTimings(page)).status, { timeout: 30000 }).toBe("available");
        await expect(page.getByText("1. scene", { exact: true })).toBeVisible();
        await page.locator('[role="radio"][value="Properties"]').click();
        expect((await ReadTimings(page)).enabled).toBe(true);
        await page.locator('[role="radio"][value="Statistics"]').click();
        await expect(toggle).toBeChecked();
        await expect(page.getByRole("button", { name: "Export GPU Samples to CSV", exact: true })).toBeEnabled();
        const download = page.waitForEvent("download");
        await page.getByRole("button", { name: "Export GPU Samples to CSV", exact: true }).click();
        expect((await download).suggestedFilename()).toBe("babylon-lite-gpu-samples.csv");
        await page.evaluate(() => (window as LiteTestWindow).liteInspectorToken.dispose());
        await expect.poll(async () => (await ReadTimings(page)).enabled).toBe(false);
    }
    expect(errors).toEqual([]);
});

test("Lite Inspector statistics preserve application-owned GPU task profiling", async ({ page }) => {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteInspectorToken" in window);
    if (!(await ReadTimings(page)).supported) {
        test.skip(true, "Timestamp queries are not supported by this WebGPU device.");
    }
    await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        await state.liteInspectorToken.dispose();
        await state.liteSetRenderTaskGpuTimingEnabled(state.liteEngine, true);
    });
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.liteInspectorToken = state.liteShowInspector(state.liteEngine);
    });
    await page.locator('[role="radio"][value="Statistics"]').click();
    await expect(page.getByRole("switch")).toBeChecked();
    await expect(page.getByRole("switch")).toBeDisabled();
    await expect(page.getByText("GPU task timing is managed by the application; Inspector will not change it.", { exact: true })).toBeVisible();
    await page.evaluate(() => (window as LiteTestWindow).liteInspectorToken.dispose());
    expect((await ReadTimings(page)).enabled).toBe(true);
});
