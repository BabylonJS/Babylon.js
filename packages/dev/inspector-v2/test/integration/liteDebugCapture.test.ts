import { expect, test, type Page } from "@playwright/test";
import { type AnimationGroup, type EngineContext, type SceneContext, type SurfaceContext } from "@babylonjs/lite";
import { readFile } from "fs/promises";
import sharp from "sharp";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteEngine: EngineContext;
        liteSecondarySurface: SurfaceContext;
        litePrimaryScene: SceneContext;
        liteAnimationGroups: AnimationGroup[];
        resumeCaptureEncoding?: () => void;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite`;

test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");

test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: {
        args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])],
    },
});

async function OpenTools(page: Page): Promise<void> {
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteEngine" in window);
    await page.locator('[role="radio"][value="Tools"]').click();
}

async function UndockTools(page: Page): Promise<Page> {
    const container = page
        .getByText("Tools", { exact: true })
        .and(page.locator("span"))
        .locator("xpath=ancestor::div[.//button[contains(@class,'fui-SplitButton__menuButton')]][1]");
    await container.locator(".fui-SplitButton__menuButton").last().click();
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("menuitem", { name: "Undock", exact: true }).click();
    const popup = await popupPromise;
    await expect(popup.getByRole("button", { name: "Capture Screenshot", exact: true })).toBeVisible();
    return popup;
}

async function GetCanvasPixelsAsync(page: Page): Promise<Buffer> {
    return await sharp(await page.locator("#canvas").screenshot())
        .removeAlpha()
        .raw()
        .toBuffer();
}

function CountYellowPixels(pixels: Buffer): number {
    let count = 0;
    for (let index = 0; index < pixels.length; index += 3) {
        if (pixels[index] > 200 && pixels[index + 1] > 120 && pixels[index + 1] < 235 && pixels[index + 2] < 80) {
            count++;
        }
    }
    return count;
}

test("Lite Inspector screenshots capture the primary and auxiliary surfaces at their native dimensions", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenTools(page);
    for (const auxiliary of [false, true]) {
        if (auxiliary) {
            await page.getByRole("combobox").click();
            await page.getByRole("option", { name: "Surface 1: spriteCanvas", exact: true }).click();
        }
        const dimensions = await page.evaluate((useAuxiliary) => {
            const state = window as LiteTestWindow;
            const canvas = (useAuxiliary ? state.liteSecondarySurface : state.liteEngine).canvas;
            return { width: canvas.width, height: canvas.height };
        }, auxiliary);
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Capture Screenshot", exact: true }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe("screenshot.png");
        const path = await download.path();
        expect(path).not.toBeNull();
        const png = await readFile(path!);
        expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        expect(png.readUInt32BE(16)).toBe(dimensions.width);
        expect(png.readUInt32BE(20)).toBe(dimensions.height);
        const stats = await sharp(png).stats();
        expect(stats.channels[0].max - stats.channels[0].min).toBeGreaterThan(20);
        await expect(page.getByRole("button", { name: "Capture Screenshot", exact: true })).toBeEnabled();
    }
    expect(errors).toEqual([]);
});

for (const mode of ["filtered", "hidden"] as const) {
    test(`Lite Inspector screenshots work when the video row is ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        if (mode === "hidden") {
            await page.addInitScript(() => localStorage.setItem("Babylon/Accordion/Hidden/Lite Tools", JSON.stringify(["Lite Tools/Capture/Record Video"])));
        }
        await OpenTools(page);
        if (mode === "filtered") {
            await page.getByPlaceholder("Filter", { exact: true }).last().fill("Capture Screenshot");
        }
        await expect(page.getByRole("button", { name: "Record Video", exact: true })).toHaveCount(0);
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Capture Screenshot", exact: true }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe("screenshot.png");
        expect(errors).toEqual([]);
    });
}

for (const lifetime of ["tab changes", "popup closure and redocking"] as const) {
    test(`Lite Inspector video capture survives ${lifetime} and downloads playable canvas content`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await OpenTools(page);
        const recordingPage = lifetime === "tab changes" ? page : await UndockTools(page);
        if (recordingPage !== page) {
            recordingPage.on("pageerror", (error) => errors.push(error.message));
        }
        await recordingPage.getByRole("button", { name: "Record Video", exact: true }).click();
        await expect(recordingPage.getByRole("button", { name: "Stop Recording", exact: true })).toBeVisible();
        await expect(recordingPage.getByRole("combobox")).toBeDisabled();
        if (recordingPage === page) {
            await page.locator('[role="radio"][value="Debug"]').click();
        } else {
            await recordingPage.close();
        }
        await page.waitForTimeout(1500);
        await page.locator('[role="radio"][value="Tools"]').click();
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Stop Recording", exact: true }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/^recording\.(webm|mp4)$/);
        const data = await readFile((await download.path())!);
        expect(data.length).toBeGreaterThan(1000);
        const video = await page.evaluate(async (base64) => {
            const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([bytes]));
            const element = document.createElement("video");
            element.muted = true;
            element.src = url;
            try {
                await new Promise<void>((resolve, reject) => {
                    element.onloadeddata = () => resolve();
                    element.onerror = () => reject(new Error("The recorded video could not be decoded."));
                });
                // Canvas capture tracks can begin with a blank frame before the next presentation.
                await new Promise<void>((resolve) => {
                    element.onseeked = () => resolve();
                    element.currentTime = 0.5;
                });
                const canvas = document.createElement("canvas");
                canvas.width = element.videoWidth;
                canvas.height = element.videoHeight;
                const context = canvas.getContext("2d")!;
                context.drawImage(element, 0, 0);
                const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                let minimum = 255;
                let maximum = 0;
                for (let index = 0; index < pixels.length; index += 4) {
                    minimum = Math.min(minimum, pixels[index]);
                    maximum = Math.max(maximum, pixels[index]);
                }
                return { width: element.videoWidth, height: element.videoHeight, range: maximum - minimum };
            } finally {
                URL.revokeObjectURL(url);
            }
        }, data.toString("base64"));
        expect(video.width).toBeGreaterThan(0);
        expect(video.height).toBeGreaterThan(0);
        expect(video.range).toBeGreaterThan(20);
        await expect(page.getByRole("button", { name: "Record Video", exact: true })).toBeEnabled();
        expect(errors).toEqual([]);
    });
}

test("Lite Inspector screenshot completion survives popup closure during PNG encoding", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenTools(page);
    const popup = await UndockTools(page);
    popup.on("pageerror", (error) => errors.push(error.message));
    await page.evaluate(() => {
        const toBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
            HTMLCanvasElement.prototype.toBlob = toBlob;
            (window as LiteTestWindow).resumeCaptureEncoding = () => this.toBlob(callback, type, quality);
        };
    });
    const downloadPromise = page.waitForEvent("download");
    await popup.getByRole("button", { name: "Capture Screenshot", exact: true }).click();
    await page.waitForFunction(() => !!(window as LiteTestWindow).resumeCaptureEncoding);
    await popup.close();
    await page.locator('[role="radio"][value="Tools"]').click();
    await expect(page.getByRole("button", { name: "Capturing Screenshot...", exact: true })).toBeDisabled();
    await page.evaluate(() => (window as LiteTestWindow).resumeCaptureEncoding!());
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("screenshot.png");
    const image = await readFile((await download.path())!);
    const dimensions = await page.locator("#canvas").evaluate((canvas: HTMLCanvasElement) => ({ width: canvas.width, height: canvas.height }));
    expect(image.readUInt32BE(16)).toBe(dimensions.width);
    expect(image.readUInt32BE(20)).toBe(dimensions.height);
    await expect(page.getByRole("button", { name: "Capture Screenshot", exact: true })).toBeEnabled();
    expect(errors).toEqual([]);
});

test("Lite Inspector debug helpers create non-pickable scene meshes, survive tab changes, and clean up", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenTools(page);
    await page.locator('[role="radio"][value="Debug"]').click();
    await page.evaluate(() => {
        for (const group of (window as LiteTestWindow).liteAnimationGroups) {
            group.isPlaying = false;
        }
    });
    const count = () => page.evaluate(() => (window as LiteTestWindow).litePrimaryScene.meshes.filter((mesh) => mesh.name.startsWith("Inspector ")).length);
    const grid = page.getByRole("switch", { name: "Ground Grid" });
    const bounds = page.getByRole("switch", { name: "Bounding Boxes" });
    const baseline = await GetCanvasPixelsAsync(page);
    await grid.click();
    await expect.poll(count).toBe(1);
    const withGrid = await GetCanvasPixelsAsync(page);
    expect(withGrid.length).toBe(baseline.length);
    let changedPixels = 0;
    for (let index = 0; index < withGrid.length; index += 3) {
        if (Math.abs(withGrid[index] - baseline[index]) + Math.abs(withGrid[index + 1] - baseline[index + 1]) + Math.abs(withGrid[index + 2] - baseline[index + 2]) > 30) {
            changedPixels++;
        }
    }
    expect(changedPixels).toBeGreaterThan(1000);
    await bounds.click();
    await expect.poll(count).toBe(4);
    await expect.poll(async () => CountYellowPixels(await GetCanvasPixelsAsync(page))).toBeGreaterThan(CountYellowPixels(withGrid) + 20);
    expect(
        await page.evaluate(() => (window as LiteTestWindow).litePrimaryScene.meshes.filter((mesh) => mesh.name.startsWith("Inspector ")).every((mesh) => mesh.pickable === false))
    ).toBe(true);
    await expect(grid).toBeChecked();
    await expect(bounds).toBeChecked();
    await page.locator('[role="radio"][value="Tools"]').click();
    await page.locator('[role="radio"][value="Debug"]').click();
    await expect(grid).toBeChecked();
    await expect(bounds).toBeChecked();
    await grid.click();
    await bounds.click();
    await expect.poll(count).toBe(0);
    expect(errors).toEqual([]);
});

test("Lite Inspector bounding boxes stay synchronized with animated and parented meshes even in manual watch mode", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenTools(page);
    await page.locator('[role="radio"][value="Settings"]').click();
    const watchMode = page.getByText("Preferred Watch Mode", { exact: true }).locator("xpath=ancestor::div[.//*[@role='combobox']][1]");
    await watchMode.getByRole("combobox").click();
    await page.getByRole("option", { name: "Manual", exact: true }).click();
    await page.locator('[role="radio"][value="Debug"]').click();
    await page.getByRole("switch", { name: "Bounding Boxes" }).check();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).litePrimaryScene.meshes.filter((mesh) => mesh.name.startsWith("Inspector Bounds: ")).length)).toBe(3);
    const result = await page.evaluate(async () => {
        const scene = (window as LiteTestWindow).litePrimaryScene;
        const pairs = scene.meshes
            .filter((mesh) => !mesh.name.startsWith("Inspector "))
            .map((source) => ({ source, box: scene.meshes.find((mesh) => mesh.name === `Inspector Bounds: ${source.name}`)! }));
        const children = pairs.map(({ source }) => source.children.slice());
        let maximumError = 0;
        let motion = 0;
        let previousY = pairs[0].source.worldMatrix[13];
        for (let frame = 0; frame < 30; frame++) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            for (const { source, box } of pairs) {
                const sourceMatrix = source.worldMatrix;
                const boxMatrix = box.worldMatrix;
                for (let index = 0; index < 16; index++) {
                    maximumError = Math.max(maximumError, Math.abs(boxMatrix[index] - sourceMatrix[index]));
                }
            }
            const y = pairs[0].source.worldMatrix[13];
            motion += Math.abs(y - previousY);
            previousY = y;
        }
        return {
            maximumError,
            motion,
            unchangedHierarchy: pairs.every(
                ({ source }, index) => source.children.length === children[index].length && source.children.every((child, i) => child === children[index][i])
            ),
        };
    });
    expect(result.motion).toBeGreaterThan(0.01);
    expect(result.maximumError).toBeLessThan(0.000001);
    expect(result.unchangedHierarchy).toBe(true);
    expect(errors).toEqual([]);
});

test("Lite Inspector helper cleanup preserves application meshes and their world transforms", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenTools(page);
    await page.locator('[role="radio"][value="Debug"]').click();
    const gridSwitch = page.getByRole("switch", { name: "Ground Grid", exact: true });
    await gridSwitch.check();
    const before = await page.evaluate(() => {
        const state = window as LiteTestWindow;
        for (const group of state.liteAnimationGroups) {
            group.isPlaying = false;
        }
        const scene = state.litePrimaryScene;
        const grid = scene.meshes.find((mesh) => mesh.name === "Inspector Ground Grid")!;
        const sources = scene.meshes.filter((mesh) => !mesh.name.startsWith("Inspector "));
        const source = sources.find((mesh) => !mesh.parent)!;
        grid.position.set(4, 2, -3);
        grid.scaling.set(2, 3, 1);
        source.parent = grid;
        grid.children.push(source);
        return {
            sourceName: source.name,
            meshes: sources.map((mesh) => ({ name: mesh.name, matrix: Array.from(mesh.worldMatrix) })),
        };
    });
    await gridSwitch.uncheck();
    const after = await page.evaluate((sourceName) => {
        const meshes = (window as LiteTestWindow).litePrimaryScene.meshes;
        return {
            detached: meshes.find((mesh) => mesh.name === sourceName)?.parent === null,
            meshes: meshes.map((mesh) => ({ name: mesh.name, matrix: Array.from(mesh.worldMatrix) })),
        };
    }, before.sourceName);
    expect(after.detached).toBe(true);
    expect(after.meshes.map((mesh) => mesh.name)).toEqual(before.meshes.map((mesh) => mesh.name));
    for (let mesh = 0; mesh < before.meshes.length; mesh++) {
        for (let index = 0; index < 16; index++) {
            expect(after.meshes[mesh].matrix[index]).toBeCloseTo(before.meshes[mesh].matrix[index], 5);
        }
    }
    expect(errors).toEqual([]);
});
