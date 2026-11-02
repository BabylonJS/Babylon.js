import { expect, test } from "@playwright/test";

type LiteFrameGraphTestWindow = Window &
    typeof globalThis & {
        liteGetFrameGraphTaskState: () => { name: string; executionEnabled?: boolean }[];
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite`;

test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");

// Lite requires WebGPU. CUSTOM_FLAGS can select Dawn's software adapter on GPU-less hosts.
test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: {
        args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])],
    },
});

test("Lite Inspector frame graph task switches match runtime order and apply execution gates", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteGetFrameGraphTaskState" in window);
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const section = page.getByRole("treeitem", { name: "Frame Graphs", exact: true });
    await section.click();
    await section.press("ArrowRight");
    const graph = page.getByRole("treeitem", { name: "Frame Graph", exact: true });
    await expect(graph).toHaveCount(1);
    await graph.click();
    await expect(page.getByText("Tasks", { exact: true })).toBeVisible();
    const tasks = await page.evaluate(() => (window as LiteFrameGraphTestWindow).liteGetFrameGraphTaskState());
    expect(tasks.length).toBeGreaterThan(0);
    const switches = page.getByRole("switch");
    await expect(switches).toHaveCount(tasks.length);
    for (const [index, task] of tasks.entries()) {
        const row = page.getByText(`${index + 1}. ${task.name}`, { exact: true }).locator("xpath=ancestor::div[.//input][1]");
        await expect(row.getByRole("switch")).toBeChecked();
        expect(task.executionEnabled).not.toBe(false);
    }
    const first = switches.first();
    await first.click();
    await expect.poll(() => page.evaluate(() => (window as LiteFrameGraphTestWindow).liteGetFrameGraphTaskState()[0].executionEnabled)).toBe(false);
    await expect(first).not.toBeChecked();
    await first.click();
    await expect.poll(() => page.evaluate(() => (window as LiteFrameGraphTestWindow).liteGetFrameGraphTaskState()[0].executionEnabled)).toBe(true);
    await expect(first).toBeChecked();

    await expect(page.getByText("General", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Optimize Texture Allocation", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Make Active|Edit Graph/ })).toHaveCount(0);
    await graph.click({ button: "right" });
    await expect(page.getByRole("menuitem", { name: /Make Active|Edit Graph/ })).toHaveCount(0);
    expect(errors).toEqual([]);
});
