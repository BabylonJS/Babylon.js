import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import type { ViewerElement } from "viewer/lite/viewerElement";

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

/**
 * Waits until the viewer exists and no load (model or environment) is in flight. Unlike
 * {@link waitForModelLoaded}, this does NOT require a model to be present, so it also works for
 * environment-only scenes and for the model-cleared state.
 */
async function waitForLoadingComplete(page: Page) {
    await page.waitForFunction(() => {
        const viewer = (document.querySelector("babylon-viewer") as ViewerElement).viewer;
        return viewer != null && viewer.loadingProgress === false;
    });
}

/**
 * Waits until no camera interpolation is in flight. `resetCamera()` (and hotspot focus) animate the
 * camera over many frames toward the goal pose (exponential ease at factor 0.1, so full convergence can
 * take ~60+ frames — more than the fixed frame burst below). The viewer holds an abort handle for the
 * active interpolation and clears it on completion, so poll that: without this the screenshot can be
 * captured mid-animation, producing a slightly-off framing and a flaky diff.
 */
async function waitForCameraSettled(page: Page) {
    await page.waitForFunction(() => {
        const element = document.querySelector("babylon-viewer") as ViewerElement | null;
        const viewer = element?.viewer as unknown as { _cameraInterpolationAbort: unknown } | null | undefined;
        return viewer != null && viewer._cameraInterpolationAbort === null;
    });
}

async function expectScreenshotMatch(page: Page, name: string, maxDiffPixelRatio = 0.011) {
    // Lite renders continuously (no autoSuspend/isIdle yet), so "settled" is approximated by: no load in
    // flight, no camera interpolation in flight, then a fixed burst of rendered frames to let deferred GPU
    // work (skybox/ground builders, shadow map, material swaps) drain into a stable image. This
    // intentionally does NOT require a model (environment-only and model-cleared scenes have none).
    await waitForLoadingComplete(page);
    await waitForCameraSettled(page);
    const before = await waitForFrameCount(page, 1);
    await waitForFrameCount(page, before + 30);

    // Lite and the full viewer share the SAME committed reference images, and now that Lite renders the
    // viewer's default "neutral" tone mapping (matching full) these can use the full viewer's per-pixel
    // `threshold` (0.035). Most scenes match within the full viewer's `maxDiffPixelRatio` (0.011). A few
    // still exceed it for genuine renderer differences (not tone mapping): a small residual PBR/AA delta on
    // a large lit surface (e.g. the zoomed boombox), and high-frequency sampling noise on fine textures
    // (e.g. the shoe's woven mesh upper). Those callers pass a looser per-test `maxDiffPixelRatio`; the
    // check still catches pose errors, missing/wrong geometry, and other gross regressions.
    await expect(page.locator("babylon-viewer")).toHaveScreenshot(name, {
        threshold: 0.035,
        maxDiffPixelRatio,
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

// ============================================================
// These tests mirror the full viewer's viewer.test.ts and are kept in the SAME order for easy
// side-by-side comparison. Test code is Lite-idiomatic: the full viewer reads state via
// `element.viewerDetails.viewer`, while Lite exposes it directly as `element.viewer` (Lite has no
// `viewerDetails`). Screenshot tests validate against the SAME committed reference images as the full
// viewer (see expectScreenshotMatch for the shared-reference tolerance rationale).
// ============================================================

test("viewer available", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer>
        </babylon-viewer>
        `
    );

    const hasViewer = await page.waitForFunction((viewerElement) => {
        return (viewerElement as ViewerElement).viewer != null;
    }, viewerElementHandle);

    expect(await hasViewer.jsonValue()).toBe(true);
});

test("animation-auto-play", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/ufo.glb"
            animation-auto-play
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const isAnimationPlaying = await page.waitForFunction((viewerElement) => {
        return (viewerElement as ViewerElement).viewer?.isAnimationPlaying;
    }, viewerElementHandle);

    expect(await isAnimationPlaying.jsonValue()).toBeTruthy();
});

test('selected-animation="n"', async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/ufo.glb"
            selected-animation="1"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const selectedAnimation = await page.waitForFunction((viewerElement) => {
        const viewer = (viewerElement as ViewerElement).viewer;
        return viewer?.isModelLoaded ? viewer.selectedAnimation : undefined;
    }, viewerElementHandle);

    expect(await selectedAnimation.jsonValue()).toEqual(1);
});

// This validates against the SAME committed reference image (viewer-camera-orbit.png) as the full
// viewer's `camera-orbit="a b r"` test. Separate, Lite-idiomatic test code; shared baseline.
test('camera-orbit="a b r"', async ({ page }) => {
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

    // Close-up (radius 0.1) framing of the boombox fills most of the frame, so a small residual PBR/AA
    // delta between the Lite and full-viewer renderers covers a slightly larger pixel fraction here.
    await expectScreenshotMatch(page, "viewer-camera-orbit.png", 0.03);
});

test('camera-target="x y z"', async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            camera-target=" 1 2 3 "
        >
        </babylon-viewer>
        `
    );

    // Lite has no public camera accessor on the element, so read the internal camera target directly.
    const cameraTarget = await page.waitForFunction((viewerElement) => {
        const viewer = (viewerElement as ViewerElement).viewer as unknown as { _camera?: { target: { x: number; y: number; z: number } }; isModelLoaded: boolean } | undefined;
        if (viewer?.isModelLoaded && viewer._camera) {
            return [viewer._camera.target.x, viewer._camera.target.y, viewer._camera.target.z];
        }
        return undefined;
    }, viewerElementHandle);

    expect(await cameraTarget.jsonValue()).toEqual([1, 2, 3]);
});

test('material-variant="name"', async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/shoe_variants.glb"
            material-variant="street"
        >
        </babylon-viewer>
        `
    );

    const materialVariant = await page.waitForFunction((viewerElement) => {
        const viewer = (viewerElement as ViewerElement).viewer;
        return viewer?.isModelLoaded ? viewer.selectedMaterialVariant : undefined;
    }, viewerElementHandle);

    expect(await materialVariant.jsonValue()).toEqual("street");

    // The shoe's woven mesh upper is fine high-frequency texture that samples slightly differently between
    // Lite and the full viewer, so a small fraction of pixels differ (not tone mapping / geometry).
    await expectScreenshotMatch(page, "viewer-material-variant.png", 0.11);
});

test("load model from URL", async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const hasModel = await page.evaluate(() => {
        const viewer = (document.querySelector("babylon-viewer") as ViewerElement).viewer;
        return viewer?.isModelLoaded === true;
    });
    expect(hasModel).toBe(true);

    await expectScreenshotMatch(page, "viewer-load-model-url.png");
});

test("change model source", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Change source to a different model. Wait for the swap to actually commit before screenshotting:
    // register a `modelchange` listener for the NEW source before mutating the attribute, then await it.
    // `onModelChanged` fires only after the swapped model has loaded and its renderables have been built
    // (Lite Viewer `_loadModelImpl`). `waitForModelLoaded` alone is racy here — right after the attribute
    // change it can still observe the previously-loaded model and return early.
    await page.evaluate((viewerElement) => {
        return new Promise<void>((resolve) => {
            viewerElement.addEventListener("modelchange", ((e: CustomEvent) => {
                if (typeof e.detail === "string" && e.detail.includes("shoe_variants.glb")) {
                    resolve();
                }
            }) as EventListener);
            viewerElement.setAttribute("source", "https://assets.babylonjs.com/meshes/shoe_variants.glb");
        });
    }, viewerElementHandle);

    await waitForModelLoaded(page);
    // The shoe's woven mesh upper is fine high-frequency texture that samples slightly differently between
    // Lite and the full viewer, so a small fraction of pixels differ (not tone mapping / geometry).
    await expectScreenshotMatch(page, "viewer-change-model-source.png", 0.11);
});

test("clear model", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Clear the model by removing the source attribute.
    await page.evaluate((viewerElement) => {
        viewerElement.removeAttribute("source");
    }, viewerElementHandle);

    // Wait for the model to be cleared.
    await page.waitForFunction((viewerElement) => {
        return (viewerElement as ViewerElement).viewer?.isModelLoaded === false;
    }, viewerElementHandle);

    await expectScreenshotMatch(page, "viewer-clear-model.png");
});

test("invalid model source fires modelerror", async ({ page }) => {
    // This test intentionally triggers a model loading error.
    expectConsoleErrors = true;

    await page.goto(viewerUrl, { waitUntil: "load" });

    const errorFired = await page.evaluate(() => {
        return new Promise<boolean>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("modelerror event not fired")), 15000);
            const container = document.createElement("div");
            container.innerHTML = '<babylon-viewer source="https://assets.babylonjs.com/meshes/nonexistent_model_12345.glb"></babylon-viewer>';
            const viewer = container.querySelector("babylon-viewer")!;
            viewer.addEventListener(
                "modelerror",
                () => {
                    clearTimeout(timeout);
                    resolve(true);
                },
                { once: true }
            );
            document.body.appendChild(container);
        });
    });

    expect(errorFired).toBe(true);
});

// ============================================================
// Environment
// ============================================================

test("environment lighting with model", async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            environment-lighting="https://assets.babylonjs.com/environments/environmentSpecular.env"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-env-lighting.png");
});

// Regression test: a model whose PBR pipeline is built BEFORE the environment finishes loading must
// still be lit once the environment arrives. Lite bakes the environment (IBL) textures into the PBR
// shaders at build time and `loadEnvironment` only updates `scene._envTextures` + the skybox — it does
// not rebuild existing PBR groups — so without an explicit relight the model renders black while the
// skybox still looks correct. The viewer forces a PBR rebuild after an environment load when a model is
// present (see `_rebuildModelPbrForEnvironment`). Here we make the "model built first" ordering
// deterministic: load the model with NO environment and render several frames so its pipeline is fully
// built, THEN add the lighting.
//
// The relit result is compared against the same committed reference as the concurrent "environment
// lighting with model" test, but with a looser tolerance: Lite builds a PBR pipeline slightly
// differently when it is built WITHOUT an environment and then rebuilt WITH one, versus built with the
// environment present from the start (the constructor now loads the environment before the model so the
// common path is exact — see the constructor). The post-hoc relight is therefore a few percent off the
// reference. That is well within this tolerance while an unlit (black) model — the bug this guards
// against — differs from the reference by far more, so the test still reliably catches a regression.
test("environment added after model is built relights the model", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            environment="none"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);
    // Render several frames so the model's PBR pipeline is fully built with no environment before we add
    // one — this is what makes the "model built before environment" ordering deterministic (otherwise the
    // model's async build can race the environment load and win or lose non-deterministically).
    const before = await waitForFrameCount(page, 1);
    await waitForFrameCount(page, before + 30);

    // Add the environment lighting after the model is built, and wait for the load (and the relight it
    // triggers) to finish: `environmentchange` fires at the end of the environment load, after the model
    // has been rebuilt for the new lighting.
    await page.evaluate((viewerElement) => {
        return new Promise<void>((resolve) => {
            viewerElement.addEventListener("environmentchange", () => resolve(), { once: true });
            viewerElement.setAttribute("environment-lighting", "https://assets.babylonjs.com/environments/environmentSpecular.env");
        });
    }, viewerElementHandle);

    await expectScreenshotMatch(page, "viewer-env-lighting.png");
});

test("environment skybox", async ({ page }) => {
    // Regression test for the previous behavior where requesting a skybox with no lighting loaded threw.
    // ViewerLite now loads the requested skybox URL as the environment (Lite couples skybox + IBL to one
    // cubemap). This is validated behaviorally rather than via a shared reference screenshot: the full
    // viewer blurs the skybox by default (environmentConfig.blur = 0.3), a feature ViewerLite does not
    // support yet, so the backgrounds diverge too much for pixel parity.
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            environment-skybox="https://assets.babylonjs.com/environments/environmentSpecular.env"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // The skybox path resolved to a URL instead of throwing.
    const skyboxUrl = await page.evaluate(() => {
        const viewer = (document.querySelector("babylon-viewer") as ViewerElement).viewer as unknown as { _currentSkyboxUrl: string | null };
        return viewer._currentSkyboxUrl;
    });
    expect(skyboxUrl).toBe("https://assets.babylonjs.com/environments/environmentSpecular.env");
});

// ============================================================
// Camera
// ============================================================

test("camera-auto-orbit", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            camera-auto-orbit
            camera-auto-orbit-speed="0.1"
            camera-auto-orbit-delay="500"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const autoOrbit = await page.evaluate((viewerElement) => {
        const viewer = (viewerElement as ViewerElement).viewer;
        return {
            enabled: viewer?.cameraAutoOrbit.enabled,
            speed: viewer?.cameraAutoOrbit.speed,
            delay: viewer?.cameraAutoOrbit.delay,
        };
    }, viewerElementHandle);

    expect(autoOrbit.enabled).toBe(true);
    expect(autoOrbit.speed).toBe(0.1);
    expect(autoOrbit.delay).toBe(500);
});

test("resetCamera()", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            camera-orbit="2 auto auto"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Reset the camera.
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).resetCamera();
    }, viewerElementHandle);

    await expectScreenshotMatch(page, "viewer-reset-camera.png");
});

// ============================================================
// Material Variants
// ============================================================

test("materialVariants list", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/shoe_variants.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const variants = await page.evaluate((viewerElement) => {
        return [...((viewerElement as ViewerElement).viewer?.materialVariants ?? [])];
    }, viewerElementHandle);

    expect(variants.length).toBeGreaterThan(0);
    expect(variants).toContain("street");
});

test("change material variant dynamically", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/shoe_variants.glb"
            material-variant="street"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Get available variants and switch to a different one.
    const newVariant = await page.evaluate((viewerElement) => {
        const viewer = (viewerElement as ViewerElement).viewer;
        if (viewer) {
            const variants = viewer.materialVariants;
            const other = variants.find((v) => v !== "street");
            if (other) {
                viewer.selectedMaterialVariant = other;
                return other;
            }
        }
        return null;
    }, viewerElementHandle);

    expect(newVariant).not.toBeNull();

    await expectScreenshotMatch(page, "viewer-material-variant-changed.png");
});

// ============================================================
// Clear Color
// ============================================================

test('clear-color="red"', async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            clear-color="red"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-clear-color-red.png");
});

// ============================================================
// Animations
// ============================================================

test("toggleAnimation()", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/ufo.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Initially animation should not be playing.
    const initiallyPlaying = await page.evaluate((viewerElement) => {
        return (viewerElement as ViewerElement).viewer?.isAnimationPlaying;
    }, viewerElementHandle);
    expect(initiallyPlaying).toBe(false);

    // Toggle animation on.
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).toggleAnimation();
    }, viewerElementHandle);

    const isPlayingAfterToggle = await page.evaluate((viewerElement) => {
        return (viewerElement as ViewerElement).viewer?.isAnimationPlaying;
    }, viewerElementHandle);
    expect(isPlayingAfterToggle).toBe(true);

    // Toggle animation off.
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).toggleAnimation();
    }, viewerElementHandle);

    await page.waitForFunction((viewerElement) => {
        return !(viewerElement as ViewerElement).viewer?.isAnimationPlaying;
    }, viewerElementHandle);
});

test("animation speed", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/ufo.glb"
            animation-speed="2"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const speed = await page.evaluate((viewerElement) => {
        return (viewerElement as ViewerElement).viewer?.animationSpeed;
    }, viewerElementHandle);
    expect(speed).toBe(2);
});

test("animations list", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/ufo.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const animations = await page.evaluate((viewerElement) => {
        return [...((viewerElement as ViewerElement).viewer?.animations ?? [])];
    }, viewerElementHandle);

    expect(animations.length).toBeGreaterThan(0);
});

// ============================================================
// Events
// ============================================================

test("viewerready event", async ({ page }) => {
    await page.goto(viewerUrl, { waitUntil: "load" });

    const readyPromise = page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
            const container = document.createElement("div");
            container.innerHTML = "<babylon-viewer></babylon-viewer>";
            const viewer = container.querySelector("babylon-viewer")!;
            viewer.addEventListener("viewerready", () => resolve(true), { once: true });
            document.body.appendChild(container);
        });
    });

    expect(await readyPromise).toBe(true);
});

test("modelchange event", async ({ page }) => {
    await page.goto(viewerUrl, { waitUntil: "load" });

    const modelChangePromise = page.evaluate(() => {
        return new Promise<string | null>((resolve) => {
            const container = document.createElement("div");
            container.innerHTML = '<babylon-viewer source="https://assets.babylonjs.com/meshes/boombox.glb"></babylon-viewer>';
            const viewer = container.querySelector("babylon-viewer")!;
            viewer.addEventListener("modelchange", ((e: CustomEvent) => resolve(e.detail)) as EventListener, { once: true });
            document.body.appendChild(container);
        });
    });

    const detail = await modelChangePromise;
    expect(detail).toContain("boombox.glb");
});

test("selectedanimationchange event", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/ufo.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const eventFired = await page.evaluate((viewerElement) => {
        return new Promise<boolean>((resolve) => {
            viewerElement.addEventListener("selectedanimationchange", () => resolve(true), { once: true });
            (viewerElement as ViewerElement).selectedAnimation = 1;
        });
    }, viewerElementHandle);

    expect(eventFired).toBe(true);
});

test("animationplayingchange event", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/ufo.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const eventFired = await page.evaluate((viewerElement) => {
        return new Promise<boolean>((resolve) => {
            viewerElement.addEventListener("animationplayingchange", () => resolve(true), { once: true });
            (viewerElement as ViewerElement).toggleAnimation();
        });
    }, viewerElementHandle);

    expect(eventFired).toBe(true);
});

// ============================================================
// Element Lifecycle
// ============================================================

test("element removal and re-addition", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Remove the element from the DOM.
    await page.evaluate((viewerElement) => {
        viewerElement.remove();
    }, viewerElementHandle);

    // Wait a moment for cleanup.
    await page.waitForTimeout(500);

    // Re-add a new viewer element.
    await page.evaluate(() => {
        const container = document.createElement("div");
        container.innerHTML = '<babylon-viewer source="https://assets.babylonjs.com/meshes/boombox.glb"></babylon-viewer>';
        document.body.appendChild(container);
    });

    // Wait for the new element to be ready.
    await page.waitForFunction(() => {
        const viewer = (document.querySelector("babylon-viewer") as ViewerElement)?.viewer;
        return viewer != null && viewer.loadingProgress === false && viewer.isModelLoaded;
    });

    await expectScreenshotMatch(page, "viewer-re-added.png");
});

test("reload()", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Call reload.
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).reload();
    }, viewerElementHandle);

    // Wait for the viewer to reinitialize.
    await page.waitForFunction((viewerElement) => {
        const viewer = (viewerElement as ViewerElement).viewer;
        return viewer != null && viewer.loadingProgress === false && viewer.isModelLoaded;
    }, viewerElementHandle);

    await expectScreenshotMatch(page, "viewer-reload.png");
});

// ============================================================
// Reset Behavior
// ============================================================

test("reset() restores initial state", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Change camera position (zoom all the way in).
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).viewer?.updateCamera({ radius: 0.001 });
    }, viewerElementHandle);

    // Reset the viewer.
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).reset();
    }, viewerElementHandle);

    // Wait for reset to complete and the scene to settle.
    await expectScreenshotMatch(page, "viewer-reset.png");
});
