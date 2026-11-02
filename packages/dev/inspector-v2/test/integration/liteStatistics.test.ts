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

test("Lite Inspector statistics defer Fluent charts until Statistics is displayed", async ({ page }) => {
    const chartRequests: string[] = [];
    page.on("request", (request) => {
        if (/gpuTimingChart|@fluentui_react-charts/.test(request.url())) {
            chartRequests.push(request.url());
        }
    });
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteInspectorToken" in window);
    await expect(page.locator('[role="radio"][value="Properties"]')).toBeChecked();
    expect(chartRequests).toEqual([]);
    await page.locator('[role="radio"][value="Statistics"]').click();
    await expect(page.getByText('Enable "Profile GPU Tasks" to display GPU history.', { exact: true })).toBeVisible();
    expect(chartRequests.some((url) => url.includes("gpuTimingChart"))).toBe(true);
    expect(chartRequests.some((url) => url.includes("@fluentui_react-charts"))).toBe(true);
    const loadedRequests = [...chartRequests];
    await page.locator('[role="radio"][value="Properties"]').click();
    await page.locator('[role="radio"][value="Statistics"]').click();
    await expect(page.getByText('Enable "Profile GPU Tasks" to display GPU history.', { exact: true })).toBeVisible();
    expect(chartRequests).toEqual(loadedRequests);
});

test("Lite Inspector statistics show engine-wide counts, system info, and opt-in GPU timings", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await OpenStatistics(page);
    await expect(page.getByText("Total Meshes", { exact: true })).toBeVisible();
    await expect(page.getByText("Primary Surface", { exact: true })).toBeVisible();
    await expect(page.getByText("Surface 2", { exact: true })).toBeVisible();
    await expect(page.getByText("Babylon Lite (WebGPU)", { exact: true })).toBeVisible();
    for (const [label, value] of [
        ["Total Meshes", 5],
        ["Total Lights", 4],
        ["Scene Materials", 3],
        ["Scene Textures", 4],
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
        const chart = page.getByRole("img", { name: "Sampled GPU task duration history", exact: true });
        await expect(chart).toBeVisible();
        await expect(chart.getByText("Relative time (s)", { exact: true })).toBeVisible();
        await expect(chart.getByText("GPU span (ms)", { exact: true })).toBeVisible();
        for (const label of ["Relative time (s)", "GPU span (ms)"]) {
            const background = chart.getByText(label, { exact: true }).locator("xpath=preceding-sibling::*[local-name()='rect'][1]");
            await expect(background).toHaveCSS("fill", "rgba(0, 0, 0, 0)");
        }
        const line = chart.locator('path[tabindex="0"]');
        await expect.poll(async () => line.evaluate((element) => (element as SVGPathElement).getTotalLength())).toBeGreaterThan(0);
        await expect(line).toHaveAttribute("stroke-width", "2");
        const motion = await line.evaluate(
            (element) =>
                new Promise<{ betweenReadbacks: number; ticks: string[] }>((resolve) => {
                    const path = element as SVGPathElement;
                    const startedAt = performance.now();
                    let previousX = path.getPointAtLength(0).x;
                    let previousSegments = path.getAttribute("d")!.split("L").length;
                    let betweenReadbacks = 0;
                    const checkFrame = () => {
                        const x = path.getPointAtLength(0).x;
                        const segments = path.getAttribute("d")!.split("L").length;
                        if (segments === previousSegments && x < previousX - 0.001) {
                            betweenReadbacks++;
                        }
                        previousX = x;
                        previousSegments = segments;
                        if (performance.now() - startedAt < 1000) {
                            requestAnimationFrame(checkFrame);
                        } else {
                            resolve({
                                betweenReadbacks,
                                ticks: [...path.ownerSVGElement!.querySelectorAll('[class*="__xAxis"] .tick text')].map((tick) => tick.textContent!),
                            });
                        }
                    };
                    requestAnimationFrame(checkFrame);
                })
        );
        expect(motion.betweenReadbacks).toBeGreaterThan(2);
        expect(motion.ticks.map((tick) => tick.replace("\u2212", "-"))).toEqual(["-30", "-20", "-10", "0"]);
        const point = await line.evaluate((element) => {
            const path = element as SVGPathElement;
            const point = path.getPointAtLength(path.getTotalLength() / 2);
            const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM()!);
            return { x: screenPoint.x, y: screenPoint.y };
        });
        await page.mouse.move(point.x, point.y);
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(page.locator('[id^="callout"]')).toHaveCount(0);
        await expect(chart.locator("circle:visible")).toHaveCount(0);
        await expect(chart.locator('line[id^="verticalLine"]:visible')).toHaveCount(0);
        expect(await chart.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), point)).toBe(false);
        await page.mouse.move(0, 0);
        await expect(page.getByText("1. scene", { exact: true })).toBeVisible();
        const retainedSamples = page.getByText("Retained Samples", { exact: true }).locator("xpath=ancestor::div[div[@id='property']][1]");
        const readRetainedSamples = async () => Number((await retainedSamples.textContent())!.match(/\d+$/)![0]);
        const samplesBeforeCollapse = await readRetainedSamples();
        const performanceSection = page.getByRole("button", { name: "Performance", exact: true });
        await performanceSection.click();
        await expect(performanceSection).toHaveAttribute("aria-expanded", "false");
        await expect(chart).not.toBeInViewport();
        const hiddenUpdates = await line.evaluate(
            (element) =>
                new Promise<number>((resolve) => {
                    let changes = 0;
                    let previousPath = element.getAttribute("d");
                    const observer = new MutationObserver(() => {
                        const path = element.getAttribute("d");
                        if (path !== previousPath) {
                            changes++;
                            previousPath = path;
                        }
                    });
                    observer.observe(element, { attributes: true, attributeFilter: ["d"] });
                    setTimeout(() => {
                        observer.disconnect();
                        resolve(changes);
                    }, 1000);
                })
        );
        expect(hiddenUpdates).toBeLessThanOrEqual(6);
        expect(await readRetainedSamples()).toBeGreaterThan(samplesBeforeCollapse);
        expect((await ReadTimings(page)).enabled).toBe(true);
        await performanceSection.click();
        await expect(chart).toBeVisible();
        const resumedPath = await line.getAttribute("d");
        await expect.poll(() => line.getAttribute("d")).not.toBe(resumedPath);
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

test("Lite Inspector statistics preserve application profiling enabled after Inspector opens", async ({ page }) => {
    await OpenStatistics(page);
    if (!(await ReadTimings(page)).supported) {
        test.skip(true, "Timestamp queries are not supported by this WebGPU device.");
    }
    await expect(page.getByRole("switch")).not.toBeChecked();
    await page.evaluate(async () => {
        const state = window as LiteTestWindow;
        await state.liteSetRenderTaskGpuTimingEnabled(state.liteEngine, true);
    });
    await expect(page.getByRole("switch")).toBeChecked();
    await expect(page.getByRole("switch")).toBeDisabled();
    await expect(page.getByText("GPU task timing is managed by the application; Inspector will not change it.", { exact: true })).toBeVisible();
    await page.evaluate(() => (window as LiteTestWindow).liteInspectorToken.dispose());
    expect((await ReadTimings(page)).enabled).toBe(true);
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
