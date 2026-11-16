import { expect, test, type Page } from "@playwright/test";
import { type CubeTexture, type Texture2D } from "@babylonjs/lite";
import { readFile } from "fs/promises";
import sharp from "sharp";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteCreateTexturePreviewFixture(kind: "2d" | "2d-array" | "3d" | "cube"): Promise<void>;
        liteTexturePreviewFixture: Texture2D | CubeTexture;
        debugNode: object | null;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite&physics=off`;
const FirstPixels = [255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 0, 255];
const SecondPixels = [0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255];

test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");
test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: {
        args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])],
    },
});

async function OpenPreview(page: Page, kind: "2d" | "2d-array" | "3d" | "cube"): Promise<void> {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteCreateTexturePreviewFixture" in window);
    await page.evaluate((fixtureKind) => (window as LiteTestWindow).liteCreateTexturePreviewFixture(fixtureKind), kind);
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const textures = page.getByRole("treeitem", { name: "Textures", exact: true });
    await textures.click();
    await textures.press("ArrowRight");
    const fixture = page.getByRole("treeitem", { name: kind === "cube" ? /Texture \d+ \(Cube\)/ : /Texture \d+ \(2 x 2\)/ });
    await fixture.click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteTexturePreviewFixture)).toBe(true);
    // The preview section is a lazily imported chunk, which the dev server can be slow to serve under parallel workers.
    await expect(page.getByRole("button", { name: "Export Preview as PNG", exact: true })).toBeEnabled({ timeout: 30000 });
}

async function PreviewPixels(page: Page): Promise<number[]> {
    return await page.locator('canvas[aria-label="Texture preview"]').evaluate((canvas: HTMLCanvasElement) => {
        return Array.from(canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data);
    });
}

test("Lite Inspector starts while the optional Duck download is stalled", async ({ page }) => {
    test.setTimeout(60000);
    let releaseDuck!: () => void;
    const duckGate = new Promise<void>((resolve) => (releaseDuck = resolve));
    let requested = false;
    await page.route("**/Duck/glTF-Binary/Duck.glb", async (route) => {
        requested = true;
        await duckGate;
        await route.abort();
    });
    try {
        await page.goto(TestUrl, { waitUntil: "commit" });
        await expect.poll(() => requested, { timeout: 30000 }).toBe(true);
        await page.waitForFunction(() => "liteInspectorToken" in window && "liteCreateTexturePreviewFixture" in window);
    } finally {
        releaseDuck();
    }
});

test("native texture editor paints an inverted mip at the base canvas size", async ({ page }) => {
    await page.goto(TestUrl, { waitUntil: "commit" });
    const result = await page.evaluate(async (moduleUrl) => {
        const { TextureCanvasManager } = await import(moduleUrl);
        const canvas = document.createElement("canvas");
        const manager = Object.create(TextureCanvasManager.prototype);
        Object.assign(manager, {
            _originalTexture: {
                isReady: () => true,
                getSize: () => ({ width: 4, height: 4 }),
                getInternalTexture: () => ({ format: 5 }),
                getScene: () => null,
                textureFormat: 5,
                invertY: true,
                readPixels: async () => new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]),
            },
            _mipLevel: 1,
            _face: 0,
            _window: window,
            _2DCanvas: canvas,
            _3DCanvasTexture: { update: () => {} },
            setSize: (size: { width: number; height: number }) => {
                canvas.width = size.width;
                canvas.height = size.height;
            },
            updateDisplay: () => {},
        });
        await manager.grabOriginalTexture();
        return {
            size: [canvas.width, canvas.height],
            pixels: Array.from(canvas.getContext("2d")!.getImageData(0, 0, 4, 4).data),
            cached: Array.from(manager._imageData),
        };
    }, "/src/components/textureEditor/canvasManager.ts");
    const red = [255, 0, 0, 255];
    const green = [0, 255, 0, 255];
    const blue = [0, 0, 255, 255];
    const yellow = [255, 255, 0, 255];
    const pixels = [...blue, ...blue, ...yellow, ...yellow, ...blue, ...blue, ...yellow, ...yellow, ...red, ...red, ...green, ...green, ...red, ...red, ...green, ...green];
    expect(result.size).toEqual([4, 4]);
    expect(result.pixels).toEqual(pixels);
    expect(result.cached).toEqual(pixels);
});

test("Lite Inspector previews storage-row pixels, filters channels and exports the displayed PNG", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenPreview(page, "2d");
    expect(await PreviewPixels(page)).toEqual(FirstPixels);
    const originalDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Preview as PNG", exact: true }).click();
    const original = await originalDownloadPromise;
    expect(original.suggestedFilename()).toBe("texture.png");
    const originalPng = await readFile((await original.path())!);
    const originalPixels = await sharp(originalPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([originalPixels.info.width, originalPixels.info.height]).toEqual([2, 2]);
    expect([...originalPixels.data]).toEqual(FirstPixels);

    await page.getByRole("button", { name: "R", exact: true }).click();
    const redPixels = [255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255];
    await expect.poll(() => PreviewPixels(page)).toEqual(redPixels);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Preview as PNG", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("texture.png");
    const png = await readFile((await download.path())!);
    const decoded = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([decoded.info.width, decoded.info.height]).toEqual([2, 2]);
    expect([...decoded.data]).toEqual(redPixels);
    expect(errors).toEqual([]);
});

test("Lite Inspector previews the selected cube face", async ({ page }) => {
    const red = await sharp({ create: { width: 2, height: 2, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
        .png()
        .toBuffer();
    const cyan = await sharp({ create: { width: 2, height: 2, channels: 4, background: { r: 0, g: 255, b: 255, alpha: 1 } } })
        .png()
        .toBuffer();
    await page.route("**/texture-preview-fixture_*.png", (route) => route.fulfill({ contentType: "image/png", body: route.request().url().endsWith("_nz.png") ? cyan : red }));
    await OpenPreview(page, "cube");
    expect(await PreviewPixels(page)).toEqual([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]);
    await page.getByRole("button", { name: "-Z", exact: true }).click();
    await expect.poll(() => PreviewPixels(page)).toEqual([0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 255, 255]);
});

for (const kind of ["2d-array", "3d"] as const) {
    test(`Lite Inspector previews the selected ${kind} subresource`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await OpenPreview(page, kind);
        expect(await PreviewPixels(page)).toEqual(FirstPixels);
        if (kind === "3d") {
            await page.getByRole("slider", { name: "Slice" }).press("ArrowRight");
        } else {
            const layer = page.getByText("Layer", { exact: true }).locator("xpath=ancestor::div[.//input][1]");
            await layer.locator('input[type="range"]').press("ArrowRight");
        }
        await expect.poll(() => PreviewPixels(page)).toEqual(SecondPixels);
        if (kind === "2d-array") {
            await page.getByRole("slider", { name: "LOD" }).press("ArrowRight");
            await expect.poll(() => page.locator('canvas[aria-label="Texture preview"]').evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height])).toEqual([1, 1]);
        }
        expect(errors).toEqual([]);
    });
}
