import { expect, test } from "@playwright/test";

type LiteSceneRenderableWindow = Window &
    typeof globalThis & {
        liteRemoveSceneText: () => boolean;
        liteRemoveSceneSprite: () => boolean;
        liteRemoveSceneBillboard: () => boolean;
        liteSceneRenderableFixture: { text: { opacity: number }; sprite: { opacity: number; count: number }; billboard: { opacity: number; count: number } };
        liteGetSceneBillboardSystems: () => readonly object[];
        debugNode: object | null;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite&sceneRenderables=on&physics=off`;
test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");
test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: { args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])] },
});

test("scene renderables appear in Explorer, expose properties and disappear when removed", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
        const text = message.text();
        if (message.type() === "warning" && (text.includes("Bind group layout") || text.includes("Invalid CommandBuffer"))) {
            errors.push(text);
        }
    });
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteSceneRenderableFixture" in window);
    expect(
        await page.evaluate(() => [
            (window as LiteSceneRenderableWindow).liteSceneRenderableFixture.sprite.count,
            (window as LiteSceneRenderableWindow).liteSceneRenderableFixture.billboard.count,
        ])
    ).toEqual([1, 1]);
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const billboardIndex = await page.evaluate(() => {
        const state = window as LiteSceneRenderableWindow;
        return state.liteGetSceneBillboardSystems().indexOf(state.liteSceneRenderableFixture.billboard);
    });
    expect(billboardIndex).toBeGreaterThanOrEqual(0);
    for (const [sectionName, itemName, propertyName, remove, key] of [
        ["Text Renderables", "Text Renderable 1", "Ignore Depth", "liteRemoveSceneText", "text"],
        ["Depth-hosted Sprite Layers", "Sprite Layer 1", "Default Depth", "liteRemoveSceneSprite", "sprite"],
        ["Billboard Systems", `Billboard System ${billboardIndex + 1}`, "Orientation", "liteRemoveSceneBillboard", "billboard"],
    ] as const) {
        const section = page.getByRole("treeitem", { name: sectionName, exact: true });
        await section.click();
        await section.press("ArrowRight");
        const item = page.getByRole("treeitem", { name: itemName, exact: true });
        await item.click();
        await expect(page.getByText(propertyName, { exact: true })).toBeVisible();
        const opacity = page.getByText("Opacity", { exact: true }).locator("xpath=ancestor::div[.//input][1]").getByRole("textbox");
        await opacity.fill("0.6");
        await opacity.press("Enter");
        await expect.poll(() => page.evaluate((name) => (window as LiteSceneRenderableWindow).liteSceneRenderableFixture[name].opacity, key)).toBe(0.6);
        expect(await page.evaluate((name) => (window as LiteSceneRenderableWindow)[name](), remove)).toBe(true);
        await expect.poll(() => page.evaluate(() => (window as LiteSceneRenderableWindow).debugNode)).toBeNull();
        if (remove !== "liteRemoveSceneBillboard") {
            await expect(item).toHaveCount(0);
        } else {
            await expect
                .poll(() =>
                    page.evaluate(() => {
                        const state = window as LiteSceneRenderableWindow;
                        return state.liteGetSceneBillboardSystems().includes(state.liteSceneRenderableFixture.billboard);
                    })
                )
                .toBe(false);
        }
    }
    expect(errors).toEqual([]);
});
