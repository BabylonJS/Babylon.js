import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import type { ViewerElement } from "viewer/viewerElementLite";

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const cdnPort = ":" + (process.env.CDN_PORT || 1337);
const viewerUrl =
    (process.env.VIEWER_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.VIEWER_PORT || ":1342")) +
    "/packages/tools/viewer/test/apps/web/test-lite.html" +
    snapshot;

let pageErrors: Error[];
let consoleErrors: string[];
let expectConsoleErrors = false;

test.beforeEach(({ page }) => {
    pageErrors = [];
    consoleErrors = [];
    expectConsoleErrors = false;

    page.on("pageerror", (error) => {
        pageErrors.push(error);
    });

    page.on("console", (message) => {
        console.log(`[browser] ${message.text()}`);
        if (message.type() === "error" || message.type() === "warning") {
            const text = message.text();
            // Only capture messages from Babylon.js (prefixed with "BJS -").
            if (text.includes("BJS -")) {
                consoleErrors.push(text);
            }
        }
    });
});

test.afterEach(async ({ page }) => {
    // Wait until at least 50 frames have been rendered to allow async errors (e.g. WebGPU validation) to surface.
    // Lite has no engine frame counter, so we count frames via the viewer's onAfterRenderObservable.
    const actualFrameCount = await waitForFrameCount(page, 50);
    console.log(`${actualFrameCount} of minimum 50 frames rendered.`);
    expect(actualFrameCount).toBeGreaterThanOrEqual(50);
    expect(pageErrors, "Unhandled page errors").toEqual([]);
    if (!expectConsoleErrors) {
        expect(consoleErrors, "Console errors").toEqual([]);
    }
});

async function waitForFrameCount(page: Page, minFrameCount: number): Promise<number> {
    // Install a frame counter on the viewer (idempotent) and wait until it reaches the target.
    const frameCountHandle = await page.waitForFunction((minFrameCount) => {
        const viewer = (document.querySelector("babylon-viewer") as ViewerElement)?.viewer;
        if (!viewer) {
            return null;
        }
        const w = window as unknown as { __liteFrameCount?: number; __liteFrameObserverAttached?: boolean };
        if (!w.__liteFrameObserverAttached) {
            w.__liteFrameCount = 0;
            viewer.onAfterRenderObservable.add(() => {
                w.__liteFrameCount = (w.__liteFrameCount ?? 0) + 1;
            });
            w.__liteFrameObserverAttached = true;
        }
        return (w.__liteFrameCount ?? 0) >= minFrameCount ? w.__liteFrameCount : null;
    }, minFrameCount);

    return (await frameCountHandle.jsonValue()) as number;
}

async function waitForModelLoaded(page: Page) {
    await page.waitForFunction(() => {
        const element = document.querySelector("babylon-viewer") as ViewerElement;
        return element.viewer != null && element.viewer.loadingProgress === false && element.viewer.isModelLoaded;
    });
    console.log("Model loaded.");
}

async function expectScreenshotMatch(page: Page, name: string) {
    // Lite renders continuously (no autoSuspend/isIdle yet), so "settled" is approximated by:
    // model loaded (no load in flight), then a fixed burst of rendered frames to let deferred GPU
    // work (skybox/ground builders, shadow map, material swaps) drain into a stable image.
    await waitForModelLoaded(page);
    const before = await waitForFrameCount(page, 1);
    await waitForFrameCount(page, before + 30);

    // These tolerances are looser than the full viewer's (threshold 0.035 / maxDiffPixelRatio 0.011)
    // because Lite and the full viewer share the SAME committed reference image, and Lite currently
    // diverges from full on tone mapping: the viewer default "neutral" is unsupported in Lite, which
    // falls back to "aces". That produces a substantial per-pixel color shift across the lit model
    // surface (raising the per-pixel `threshold` does not help — the differing pixels differ by a lot),
    // so ~2% of the image differs. maxDiffPixelRatio 0.025 accommodates that while still catching pose
    // errors, missing geometry, and other gross regressions. When Lite gains "neutral" tone mapping (or
    // a shared reference is generated with a tone mapping both support), these can be tightened.
    await expect(page.locator("babylon-viewer")).toHaveScreenshot(name, {
        threshold: 0.1,
        maxDiffPixelRatio: 0.025,
    });
}

async function attachViewerElement(page: Page, viewerHtml: string) {
    await page.goto(viewerUrl, {
        waitUntil: "load",
    });

    await page.evaluate((viewerHtml) => {
        const container = document.createElement("div");
        container.innerHTML = viewerHtml;
        document.body.appendChild(container);
    }, viewerHtml);

    const viewerElementLocator = page.locator("babylon-viewer");
    await viewerElementLocator.waitFor();
    const viewerElementHandle = await viewerElementLocator.elementHandle();

    // Wait for the viewer instance to be available and loading to finish.
    await page.waitForFunction((viewerElement) => {
        const viewer = viewerElement && (viewerElement as ViewerElement).viewer;
        return viewer != null && viewer.loadingProgress === false;
    }, viewerElementHandle);

    // viewerElementHandle cannot be null at this point since we already waited for it to become valid above.
    return viewerElementHandle!;
}

// This mirrors the full viewer's `camera-orbit="a b r"` screenshot test and validates against the SAME
// committed reference image (viewer-camera-orbit.png). Separate, Lite-idiomatic test code; shared baseline.
test('camera-orbit="a b r"', async ({ page }) => {
    // Lite doesn't support "neutral" tone mapping (the viewer default) and warns as it falls back to
    // "aces". That warning is expected for Lite, so don't fail the console-error check on it.
    expectConsoleErrors = true;
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            camera-orbit=" 1 2 0.1 "
        >
        </babylon-viewer>
        `
    );

    await expectScreenshotMatch(page, "viewer-camera-orbit.png");
});
