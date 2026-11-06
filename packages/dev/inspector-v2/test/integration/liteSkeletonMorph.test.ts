import { expect, test, type Page } from "@playwright/test";
import { type Mesh, type SceneContext, type Skeleton } from "@babylonjs/lite";
import sharp from "sharp";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteSkinnedMesh: Mesh;
        liteMorphClone: Mesh;
        liteSkeleton: Skeleton;
        litePrimaryScene: SceneContext;
        liteRemoveSkinnedMeshes: () => void;
        debugNode: object | null;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite&physics=off`;
test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");
test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: { args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])] },
});

async function OpenSkeletons(page: Page) {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteSkeleton" in window);
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const section = page.getByRole("treeitem", { name: "Skeletons", exact: true });
    await section.click();
    await section.press("ArrowRight");
}

async function CountGreenPixels(page: Page): Promise<number> {
    const pixels = await sharp(await page.locator("#canvas").screenshot())
        .removeAlpha()
        .raw()
        .toBuffer();
    let count = 0;
    for (let index = 0; index < pixels.length; index += 3) {
        if (pixels[index + 1] > 80 && pixels[index + 1] > pixels[index] * 1.5 && pixels[index + 1] > pixels[index + 2] * 1.5) {
            count++;
        }
    }
    return count;
}

test("Lite Inspector skeleton hierarchy and mesh/bone links navigate using public identities", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenSkeletons(page);
    const skeleton = page.getByRole("treeitem", { name: "Skeleton: P9 Skinned Morph Mesh", exact: true });
    await skeleton.click();
    await expect(page.getByText("Bone Count", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "P9 Skinned Morph Mesh", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "P9 Shared Morph Clone", exact: true })).toBeVisible();
    await skeleton.press("ArrowRight");
    const root = page.getByRole("treeitem", { name: "P9 Root Bone", exact: true });
    await root.click();
    await expect(page.getByText("None", { exact: true })).toBeVisible();
    await root.press("ArrowRight");
    await page.getByRole("treeitem", { name: "P9 Child Bone", exact: true }).click();
    await expect(page.getByText("Index", { exact: true })).toBeVisible();
    await expect(page.getByText("1", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "P9 Root Bone", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteSkeleton.bones[0])).toBe(true);
    await page.getByRole("button", { name: "Skeleton: P9 Skinned Morph Mesh", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteSkeleton)).toBe(true);
    await page.getByRole("button", { name: "P9 Skinned Morph Mesh", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteSkinnedMesh)).toBe(true);
    await expect(page.getByText("Skinning", { exact: true })).toBeVisible();
    await expect(page.getByText("Morph Targets", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Skeleton: P9 Skinned Morph Mesh", exact: true }).click();
    const nodes = page.getByRole("treeitem", { name: "Nodes", exact: true });
    await nodes.click();
    await nodes.press("ArrowRight");
    await page.getByRole("treeitem", { name: "Red Box", exact: true }).click();
    await expect(page.getByText("Skinning", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Morph Targets", { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
});

test("Lite Inspector named morph sliders update shared weights and retain them without animation", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenSkeletons(page);
    await page.getByRole("treeitem", { name: "Skeleton: P9 Skinned Morph Mesh", exact: true }).click();
    await page.getByRole("button", { name: "P9 Skinned Morph Mesh", exact: true }).click();
    const initialGreenPixels = await CountGreenPixels(page);
    expect(initialGreenPixels).toBeGreaterThan(20);
    for (const [label, value] of [
        ["Widen", "0.6"],
        ["Lift", "0.3"],
    ]) {
        const row = page.getByText(label, { exact: true }).locator("xpath=ancestor::div[.//input][1]");
        await row.getByRole("textbox").fill(value);
        await row.getByRole("textbox").press("Enter");
    }
    await expect.poll(() => page.evaluate(() => [...(window as LiteTestWindow).liteSkinnedMesh.morphTargets!.weights])).toEqual([expect.closeTo(0.6), expect.closeTo(0.3)]);
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteSkinnedMesh.morphTargets === (window as LiteTestWindow).liteMorphClone.morphTargets)).toBe(true);
    // Only the two morph meshes are green. Their enlarged silhouette proves the renderer consumed the edited weights.
    await expect.poll(() => CountGreenPixels(page)).toBeGreaterThan(initialGreenPixels * 1.2);
    await page.getByRole("button", { name: "Skeleton: P9 Skinned Morph Mesh", exact: true }).click();
    await page.getByRole("button", { name: "P9 Shared Morph Clone", exact: true }).click();
    const widen = page.getByText("Widen", { exact: true }).locator("xpath=ancestor::div[.//input][1]").getByRole("textbox");
    await expect(widen).toHaveValue("0.6");
    // Let several renderer and watcher cycles pass; this fixture has no morph animation.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(widen).toHaveValue("0.6");
    await widen.fill("-0.5");
    await widen.press("Enter");
    await expect.poll(() => page.evaluate(() => [...(window as LiteTestWindow).liteSkinnedMesh.morphTargets!.weights])).toEqual([expect.closeTo(-0.5), expect.closeTo(0.3)]);
    await expect(widen).toHaveValue("-0.5");
    expect(errors).toEqual([]);
});

for (const selection of ["skeleton", "bone"] as const) {
    test(`Lite Inspector clears a selected ${selection} when the last skinned mesh is removed`, async ({ page }) => {
        await OpenSkeletons(page);
        const skeleton = page.getByRole("treeitem", { name: "Skeleton: P9 Skinned Morph Mesh", exact: true });
        await skeleton.click();
        if (selection === "bone") {
            await skeleton.press("ArrowRight");
            await page.getByRole("treeitem", { name: "P9 Root Bone", exact: true }).click();
        }
        await page.evaluate(() => (window as LiteTestWindow).liteRemoveSkinnedMeshes());
        await expect(skeleton).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode)).toBeNull();
    });
}
