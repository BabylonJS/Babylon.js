import { expect, test, type Page } from "@playwright/test";
import { type AnimationGroup, type Mesh, type SceneContext } from "@babylonjs/lite";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteAnimationGroups: AnimationGroup[];
        liteMeshes: Mesh[];
        litePrimaryScene: SceneContext;
        debugNode: object | null;
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

async function OpenAnimations(page: Page): Promise<void> {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteAnimationGroups" in window);
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const groups = page.getByRole("treeitem", { name: "Animation Groups", exact: true });
    await groups.click();
    await groups.press("ArrowRight");
}

async function SetNumericProperty(page: Page, label: string, value: string): Promise<void> {
    const row = page.getByText(label, { exact: true }).locator("xpath=ancestor::div[.//input][1]");
    const input = row.getByRole("textbox");
    await input.fill(value);
    await input.press("Enter");
}

test("Lite Inspector animation controls apply playback, frame, speed, loop, and weight edits", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenAnimations(page);
    const group = page.getByRole("treeitem", { name: /^Box Bounce/ });
    await group.click();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteAnimationGroups[0].isPlaying)).toBe(false);

    await SetNumericProperty(page, "Current Frame", "60");
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteAnimationGroups[0].currentTime)).toBe(1);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteMeshes[0].position.y)).toBeCloseTo(0.75);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteAnimationGroups[0].isPlaying)).toBe(false);

    await SetNumericProperty(page, "Speed Ratio", "2");
    await SetNumericProperty(page, "Weight", "0.4");
    await page.getByRole("switch").click();
    await expect
        .poll(() =>
            page.evaluate(() => {
                const animation = (window as LiteTestWindow).liteAnimationGroups[0];
                return { speed: animation.speedRatio, weight: animation.weight, loop: animation.loopAnimation };
            })
        )
        .toEqual({ speed: 2, weight: 0.4, loop: false });

    await SetNumericProperty(page, "Speed Ratio", "0");
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteAnimationGroups[0].isPlaying)).toBe(true);
    await SetNumericProperty(page, "Current Frame", "30");
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteAnimationGroups[0].isPlaying)).toBe(true);
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect
        .poll(() =>
            page.evaluate(() => {
                const animation = (window as LiteTestWindow).liteAnimationGroups[0];
                return { playing: animation.isPlaying, time: animation.currentTime };
            })
        )
        .toEqual({ playing: false, time: 0 });

    await group.press("ArrowRight");
    await page.getByRole("treeitem", { name: "Red Box: position", exact: true }).click();
    await expect(page.getByText("Path", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Red Box: position", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteMeshes[0])).toBe(true);
    await page.getByRole("button", { name: "Box Bounce", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteAnimationGroups[0])).toBe(true);
    expect(errors).toEqual([]);
});

test("Lite Inspector refreshes added, renamed, and removed groups and target descriptions", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenAnimations(page);
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.litePrimaryScene.animationGroups.splice(1, 1);
    });
    await expect(page.getByRole("treeitem", { name: /^Sphere Pulse/ })).toHaveCount(0);
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.litePrimaryScene.animationGroups.push(state.liteAnimationGroups[1]);
        Object.assign(state.liteAnimationGroups[1], { name: "Renamed Pulse" });
    });
    await expect(page.getByRole("treeitem", { name: /^Renamed Pulse/ })).toBeVisible();

    const group = page.getByRole("treeitem", { name: /^Box Bounce/ });
    await group.click();
    await group.press("ArrowRight");
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        Object.assign(state.liteAnimationGroups[0], {
            targetedAnimations: [...state.liteAnimationGroups[0].targetedAnimations, { targetName: "Bone", nodeIndex: 0, path: "rotation" }],
        });
    });
    const target = page.getByRole("treeitem", { name: "Bone: rotation", exact: true });
    await target.click();
    await expect(page.getByText("Target Name", { exact: true })).toBeVisible();
    await expect(page.getByText("Node Index", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bone: rotation", exact: true })).toHaveCount(0);
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        Object.assign(state.liteAnimationGroups[0], { targetedAnimations: state.liteAnimationGroups[0].targetedAnimations.slice(0, 1) });
    });
    await expect(target).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode)).toBeNull();

    await group.click();
    await page.evaluate(() => (window as LiteTestWindow).litePrimaryScene.animationGroups.splice(0, 1));
    await expect(group).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode)).toBeNull();
    expect(errors).toEqual([]);
});
