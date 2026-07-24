import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { ViewerElement } from "viewer/full/viewerElement";

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const cdnPort = ":" + (process.env.CDN_PORT || 1337);
const viewerUrl =
    (process.env.VIEWER_BASE_URL || getGlobalConfig().baseUrl.replace(cdnPort, process.env.VIEWER_PORT || ":1342")) + "/packages/tools/viewer/test/apps/web/test.html" + snapshot;

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
    const actualFrameCount = await waitForFrameCount(page, 50);
    console.log(`${actualFrameCount} of minimum 50 frames rendered.`);
    expect(actualFrameCount).toBeGreaterThanOrEqual(50);
    expect(pageErrors, "Unhandled page errors").toEqual([]);
    if (!expectConsoleErrors) {
        expect(consoleErrors, "Console errors").toEqual([]);
    }
});

async function waitForFrameCount(page: Page, minFrameCount: number): Promise<number> {
    const frameIdHandle = await page.waitForFunction((minFrameCount) => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        const engine = viewer.viewerDetails?.scene.getEngine();
        return engine && engine.frameId >= minFrameCount ? engine.frameId : null;
    }, minFrameCount);

    return (await frameIdHandle.jsonValue()) as number;
}

async function waitForModelLoaded(page: Page) {
    await page.waitForFunction(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails && viewer.viewerDetails.viewer.loadingProgress === false && viewer.viewerDetails.model !== null;
    });
    console.log("Model loaded.");
}

async function expectScreenshotMatch(page: Page, name: string) {
    // Wait for the viewer to be stably idle — three consecutive isIdle === true checks
    // with 100ms gaps to ensure rendering has fully settled.
    await page.waitForFunction(async () => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        let successfulIdleCheckCount = 0;
        while (successfulIdleCheckCount < 3) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (viewer.viewerDetails?.isIdle) {
                successfulIdleCheckCount++;
            } else {
                successfulIdleCheckCount = 0;
            }
        }
        return true;
    });

    await expect(page.locator("babylon-viewer")).toHaveScreenshot(name, {
        threshold: 0.035,
        maxDiffPixelRatio: 0.011,
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

    // Wait for viewerDetails to be available and loading to finish.
    await page.waitForFunction((viewerElement) => {
        const details = viewerElement && (viewerElement as ViewerElement).viewerDetails;
        if (details && details.viewer.loadingProgress === false) {
            details.viewer.showDebugLogs = true;
            return true;
        }
        return false;
    }, viewerElementHandle);

    // viewerElementHandle cannot be null at this point since we already waited for it to become valid in the browser context above.
    return viewerElementHandle!;
}

test("viewerDetails available", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer>
        </babylon-viewer>
        `
    );

    // Wait for the viewerDetails property to become defined
    const viewerDetails = await page.waitForFunction((viewerElement) => {
        return (viewerElement as ViewerElement).viewerDetails;
    }, viewerElementHandle);

    expect(viewerDetails).toBeDefined();
    expect(await viewerDetails.getProperty("scene")).toBeDefined();
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

    // Wait for the viewerDetails property to become defined
    const isAnimationPlaying = await page.waitForFunction((viewerElement) => {
        return (viewerElement as ViewerElement).viewerDetails?.viewer.isAnimationPlaying;
    }, viewerElementHandle);

    expect(isAnimationPlaying).toBeTruthy();
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

    // Wait for the viewerDetails property to become defined
    const selectedAnimation = await page.waitForFunction((viewerElement) => {
        const viewerDetails = (viewerElement as ViewerElement).viewerDetails;
        if (viewerDetails?.model) {
            return viewerDetails.viewer.selectedAnimation;
        }
        return undefined;
    }, viewerElementHandle);

    expect(await selectedAnimation.jsonValue()).toEqual(1);
});

test('camera-orbit="a b r"', async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            camera-orbit=" 1 2 0.1 "
        >
        </babylon-viewer>
        `
    );

    // Wait for the viewerDetails property to become defined
    const cameraPose = await page.waitForFunction((viewerElement) => {
        const viewerDetails = (viewerElement as ViewerElement).viewerDetails;
        if (viewerDetails?.model) {
            return [viewerDetails.camera.alpha, viewerDetails.camera.beta, viewerDetails.camera.radius];
        }
        return undefined;
    }, viewerElementHandle);

    expect(await cameraPose.jsonValue()).toEqual([1, 2, 0.1]);

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-camera-orbit.png");
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

    // Wait for the viewerDetails property to become defined
    const cameraPose = await page.waitForFunction((viewerElement) => {
        const viewerDetails = (viewerElement as ViewerElement).viewerDetails;
        if (viewerDetails?.model) {
            return [viewerDetails.camera.target.x, viewerDetails.camera.target.y, viewerDetails.camera.target.z];
        }
        return undefined;
    }, viewerElementHandle);

    expect(await cameraPose.jsonValue()).toEqual([1, 2, 3]);
});

test('tone-mapping="none"', async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            tone-mapping="none"
        >
        </babylon-viewer>
        `
    );

    // Wait for the viewerDetails property to become defined
    const toneMapping = await page.waitForFunction((viewerElement) => {
        const viewerDetails = (viewerElement as ViewerElement).viewerDetails;
        if (viewerDetails?.model) {
            return viewerDetails.viewer.postProcessing.toneMapping;
        }
        return undefined;
    }, viewerElementHandle);

    expect(await toneMapping.jsonValue()).toEqual("none");

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-tone-mapping-none.png");
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

    // Wait for the viewerDetails property to become defined
    const materialVariant = await page.waitForFunction((viewerElement) => {
        const viewerDetails = (viewerElement as ViewerElement).viewerDetails;
        if (viewerDetails?.model) {
            return viewerDetails.viewer.selectedMaterialVariant;
        }
        return undefined;
    }, viewerElementHandle);

    expect(await materialVariant.jsonValue()).toEqual("street");

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-material-variant.png");
});

test('environment="auto"', async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            environment="auto"
        >
        </babylon-viewer>
        `
    );

    // Wait for the viewerDetails property to become defined
    const isEnvironmentLoaded = await page.waitForFunction((viewerElement) => {
        const viewerDetails = (viewerElement as ViewerElement).viewerDetails;
        // Verify we get to a state where:
        // 1. We have the viewerDetails.
        // 2. The scene is in a ready state (it has successfully rendered at least one frame).
        // 3. The environment texture has been set.
        // 4. A skybox has been created (e.g. there is at least one mesh in the scene).
        return viewerDetails && viewerDetails.scene.isReady() && viewerDetails.scene.environmentTexture && viewerDetails.scene.meshes.length > 0;
    }, viewerElementHandle);

    expect(isEnvironmentLoaded).toBeTruthy();

    await expectScreenshotMatch(page, "viewer-environment-auto.png");
});

test('shadow-quality="high"', async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/Demos/optimized/acrobaticPlane_variants.glb"
            shadow-quality="high"
        >
        </babylon-viewer>
        `
    );

    // Wait for the viewerDetails property to become defined
    await page.waitForFunction((viewerElement) => {
        // For now, we'll just rely on the common per-test validation that there are no unhandled page errors or console errors.
        return (viewerElement as ViewerElement).viewerDetails;
    }, viewerElementHandle);

    await waitForModelLoaded(page);
    // TODO: Figure out why this is flakey on the build agents.
    // await expectScreenshotMatch(page, "viewer-shadow-quality-high.png");
});

test("concurrent lighting and skybox environment updates", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            environment="auto"
        >
        </babylon-viewer>
        `
    );

    // Trigger back-to-back lighting-only and skybox-only updates without awaiting them individually.
    // This exercises the separate abort controllers and locks to ensure they don't cancel each other.
    await waitForModelLoaded(page);
    await page.waitForFunction(async (viewerElement) => {
        const viewer = (viewerElement as ViewerElement).viewerDetails?.viewer;
        if (!viewer) {
            return false;
        }

        const results = await Promise.allSettled([viewer.resetEnvironment({ lighting: true }), viewer.resetEnvironment({ skybox: true })]);

        return results.every((r) => r.status === "fulfilled");
    }, viewerElementHandle);
});

// ============================================================
// Model Loading
// ============================================================

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
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.model !== null;
    });
    expect(hasModel).toBe(true);

    await expectScreenshotMatch(page, "viewer-load-model-url.png");
});

test("material-less model gets default clay material", async ({ page }) => {
    // A minimal cube OBJ with no MTL reference, so its mesh has no material after loading. Because the
    // viewer relies on image-based lighting (no direct lights), the engine's default StandardMaterial
    // would render such a mesh black. The viewer instead assigns a lazily-created "clay" PBR material so
    // the mesh is shaded consistently, and loads the default environment for PBR content. The model is
    // embedded inline as a base64 data URL (rather than a separate checked-in file) and loaded purely via
    // the declarative "source"/"extension" attributes. The explicit "extension" is required because a data
    // URL has no file extension for the loader to infer the format from — this also exercises the
    // construction-time load path forwarding the viewer-level plugin extension.
    const objText = [
        "v -1.0 -1.0 -1.0",
        "v -1.0 -1.0  1.0",
        "v -1.0  1.0 -1.0",
        "v -1.0  1.0  1.0",
        "v  1.0 -1.0 -1.0",
        "v  1.0 -1.0  1.0",
        "v  1.0  1.0 -1.0",
        "v  1.0  1.0  1.0",
        "vn -1.0  0.0  0.0",
        "vn  1.0  0.0  0.0",
        "vn  0.0 -1.0  0.0",
        "vn  0.0  1.0  0.0",
        "vn  0.0  0.0 -1.0",
        "vn  0.0  0.0  1.0",
        "o Cube",
        "f 1//1 2//1 4//1 3//1",
        "f 5//2 7//2 8//2 6//2",
        "f 1//3 5//3 6//3 2//3",
        "f 3//4 4//4 8//4 7//4",
        "f 1//5 3//5 7//5 5//5",
        "f 2//6 6//6 8//6 4//6",
    ].join("\n");
    const objDataUrl = `data:model/obj;base64,${Buffer.from(objText).toString("base64")}`;

    await attachViewerElement(
        page,
        `
        <babylon-viewer source="${objDataUrl}" extension=".obj">
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // The clay PBR material is assigned during load, and because it is PBR the viewer also loads the
    // default environment in its post-load step. Wait until both are in place so the assertions (and
    // the screenshot's image-based lighting) are deterministic rather than racing the post-load step.
    const materialInfo = await (
        await page.waitForFunction(() => {
            const viewer = document.querySelector("babylon-viewer") as ViewerElement;
            const scene = viewer.viewerDetails?.scene;
            const mesh = scene?.meshes.find((m) => m.name === "Cube");
            if (!mesh?.material || !scene?.environmentTexture) {
                return null;
            }
            return { className: mesh.material.getClassName(), name: mesh.material.name, hasEnvTexture: true };
        })
    ).jsonValue();
    expect(materialInfo.className).toBe("PBRMaterial");
    expect(materialInfo.name).toBe("Viewer Default Material");
    expect(materialInfo.hasEnvTexture).toBe(true);

    await expectScreenshotMatch(page, "viewer-default-clay-material.png");
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

    // Change source to a different model
    await page.evaluate((viewerElement) => {
        viewerElement.setAttribute("source", "https://assets.babylonjs.com/meshes/shoe_variants.glb");
    }, viewerElementHandle);

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-change-model-source.png");
});

test("use-open-pbr attribute applies to viewer options", async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            use-open-pbr
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    // Query the element directly inside the page rather than via an ElementHandle to reliably
    // read Lit reactive properties, which are defined on the element's prototype.
    const useOpenPBR = await page.evaluate(() => {
        const el = document.querySelector("babylon-viewer");
        return (el as ViewerElement | null)?.useOpenPBR ?? null;
    });

    expect(useOpenPBR).toBe(true);
});

test("toggling useOpenPBR reloads model", async ({ page }) => {
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

    // Capture the initial model reference, then toggle useOpenPBR to true.
    // We use model object identity (not event counting) to detect that a new model was loaded.
    await page.evaluate(() => {
        const el = document.querySelector("babylon-viewer") as ViewerElement;
        (window as any).__prevModel = el.viewerDetails?.model;
        (el as any).useOpenPBR = true;
    });

    // Wait until a different model object is present and loading has settled.
    await page.waitForFunction(() => {
        const el = document.querySelector("babylon-viewer") as ViewerElement;
        const model = el.viewerDetails?.model;
        return model !== null && model !== (window as any).__prevModel && el.viewerDetails?.viewer.loadingProgress === false;
    });

    // Toggle back to false and verify another reload occurs.
    await page.evaluate(() => {
        const el = document.querySelector("babylon-viewer") as ViewerElement;
        (window as any).__prevModel = el.viewerDetails?.model;
        (el as any).useOpenPBR = false;
    });

    await page.waitForFunction(() => {
        const el = document.querySelector("babylon-viewer") as ViewerElement;
        const model = el.viewerDetails?.model;
        return model !== null && model !== (window as any).__prevModel && el.viewerDetails?.viewer.loadingProgress === false;
    });
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

    // Clear the model by removing the source attribute
    await page.evaluate((viewerElement) => {
        viewerElement.removeAttribute("source");
    }, viewerElementHandle);

    // Wait for the model to be cleared
    await page.waitForFunction((viewerElement) => {
        const details = (viewerElement as ViewerElement).viewerDetails;
        return details && details.model === null;
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
// Gaussian Splatting
// ============================================================

test("load SPZ gaussian splat model", async ({ page }) => {
    test.setTimeout(60000);
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/splats/hornedlizard.spz"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-load-spz-splat.png");
});

// ============================================================
// OBJ + SSAO
// ============================================================

test('load OBJ model with ssao="enabled"', async ({ page }) => {
    test.setTimeout(60000);

    // SSAO's sampling-kernel rotation texture is seeded from Math.random, which would make the
    // rendered result differ between runs. Install a deterministic PRNG before any page script runs
    // so the screenshot comparison is stable.
    await page.addInitScript(() => {
        let seed = 0x9e3779b9;
        Math.random = () => {
            seed |= 0;
            seed = (seed + 0x6d2b79f5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    });

    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/StanfordBunny.obj"
            ssao="enabled"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const ssao = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.viewer.postProcessing.ssao;
    });
    expect(ssao).toBe("enabled");

    await expectScreenshotMatch(page, "viewer-obj-ssao.png");
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

    const hasEnvironment = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.scene.environmentTexture !== null;
    });
    expect(hasEnvironment).toBe(true);

    await expectScreenshotMatch(page, "viewer-env-lighting.png");
});

test("environment skybox", async ({ page }) => {
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
    await expectScreenshotMatch(page, "viewer-env-skybox.png");
});

test("environment-intensity", async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            environment="auto"
            environment-intensity="2"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const intensity = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.viewer.environmentConfig.intensity;
    });
    expect(intensity).toBe(2);

    await expectScreenshotMatch(page, "viewer-env-intensity.png");
});

test("environment-rotation", async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            environment="auto"
            environment-rotation="1.5"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const rotation = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.viewer.environmentConfig.rotation;
    });
    expect(rotation).toBe(1.5);

    await expectScreenshotMatch(page, "viewer-env-rotation.png");
});

test("skybox-blur", async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            environment-skybox="https://assets.babylonjs.com/environments/environmentSpecular.env"
            skybox-blur="0.8"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-skybox-blur.png");
});

// ============================================================
// Post-Processing
// ============================================================

test('tone-mapping="standard"', async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            tone-mapping="standard"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const toneMapping = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.viewer.postProcessing.toneMapping;
    });
    expect(toneMapping).toBe("standard");

    await expectScreenshotMatch(page, "viewer-tone-mapping-standard.png");
});

test('tone-mapping="aces"', async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            tone-mapping="aces"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const toneMapping = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.viewer.postProcessing.toneMapping;
    });
    expect(toneMapping).toBe("aces");

    await expectScreenshotMatch(page, "viewer-tone-mapping-aces.png");
});

test('tone-mapping="neutral"', async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            tone-mapping="neutral"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);
    await expectScreenshotMatch(page, "viewer-tone-mapping-neutral.png");
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
        const details = (viewerElement as ViewerElement).viewerDetails;
        return {
            enabled: details?.viewer.cameraAutoOrbit.enabled,
            speed: details?.viewer.cameraAutoOrbit.speed,
            delay: details?.viewer.cameraAutoOrbit.delay,
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

    // Reset the camera
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).resetCamera();
    }, viewerElementHandle);

    // Wait for the camera to settle
    await expectScreenshotMatch(page, "viewer-reset-camera.png");

    // Verify the camera alpha is back to a reasonable value (not 0.001)
    const resetAlpha = await page.evaluate((viewerElement) => {
        return (viewerElement as ViewerElement).viewerDetails?.camera.alpha;
    }, viewerElementHandle);
    expect(resetAlpha).not.toBe(2);
});

// ============================================================
// Shadows
// ============================================================

test('shadow-quality="none"', async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            shadow-quality="none"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const shadowQuality = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.viewer.shadowConfig.quality;
    });
    expect(shadowQuality).toBe("none");

    await expectScreenshotMatch(page, "viewer-shadow-none.png");
});

test('shadow-quality="normal"', async ({ page }) => {
    await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://assets.babylonjs.com/meshes/boombox.glb"
            shadow-quality="normal"
        >
        </babylon-viewer>
        `
    );

    await waitForModelLoaded(page);

    const shadowQuality = await page.evaluate(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer.viewerDetails?.viewer.shadowConfig.quality;
    });
    expect(shadowQuality).toBe("normal");

    await expectScreenshotMatch(page, "viewer-shadow-normal.png");
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
        const details = (viewerElement as ViewerElement).viewerDetails;
        return [...(details?.viewer.materialVariants ?? [])];
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

    // Get available variants and switch to a different one
    const newVariant = await page.evaluate((viewerElement) => {
        const details = (viewerElement as ViewerElement).viewerDetails;
        if (details) {
            const variants = details.viewer.materialVariants;
            const other = variants.find((v) => v !== "street");
            if (other) {
                details.viewer.selectedMaterialVariant = other;
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

    // Initially animation should not be playing
    const initiallyPlaying = await page.evaluate((viewerElement) => {
        return (viewerElement as ViewerElement).viewerDetails?.viewer.isAnimationPlaying;
    }, viewerElementHandle);
    expect(initiallyPlaying).toBe(false);

    // Toggle animation on
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).toggleAnimation();
    }, viewerElementHandle);

    const isPlayingAfterToggle = await page.evaluate((viewerElement) => {
        return (viewerElement as ViewerElement).viewerDetails?.viewer.isAnimationPlaying;
    }, viewerElementHandle);
    expect(isPlayingAfterToggle).toBe(true);

    // Toggle animation off
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).toggleAnimation();
    }, viewerElementHandle);

    // Wait briefly for the pause to take effect
    await page.waitForFunction((viewerElement) => {
        return !(viewerElement as ViewerElement).viewerDetails?.viewer.isAnimationPlaying;
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
        return (viewerElement as ViewerElement).viewerDetails?.viewer.animationSpeed;
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
        const details = (viewerElement as ViewerElement).viewerDetails;
        return [...(details?.viewer.animations ?? [])];
    }, viewerElementHandle);

    expect(animations.length).toBeGreaterThan(0);
});

// ============================================================
// Events
// ============================================================

test("viewerready event", async ({ page }) => {
    await page.goto(viewerUrl, { waitUntil: "load" });

    // Set up event listener before creating the element
    const readyPromise = page.evaluate(() => {
        return new Promise<boolean>((resolve) => {
            const container = document.createElement("div");
            container.innerHTML = "<babylon-viewer></babylon-viewer>";
            const viewer = container.querySelector("babylon-viewer")!;
            viewer.addEventListener("viewerready", () => resolve(true), { once: true });
            document.body.appendChild(container);
        });
    });

    const ready = await readyPromise;
    expect(ready).toBe(true);
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

    // Remove the element from the DOM
    await page.evaluate((viewerElement) => {
        viewerElement.remove();
    }, viewerElementHandle);

    // Wait a moment for cleanup
    await page.waitForTimeout(500);

    // Re-add a new viewer element
    await page.evaluate(() => {
        const container = document.createElement("div");
        container.innerHTML = '<babylon-viewer source="https://assets.babylonjs.com/meshes/boombox.glb"></babylon-viewer>';
        document.body.appendChild(container);
    });

    // Wait for the new element to be ready
    await page.waitForFunction(() => {
        const viewer = document.querySelector("babylon-viewer") as ViewerElement;
        return viewer?.viewerDetails && viewer.viewerDetails.viewer.loadingProgress === false && viewer.viewerDetails.model !== null;
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

    // Call reload
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).reload();
    }, viewerElementHandle);

    // Wait for the viewer to reinitialize
    await page.waitForFunction((viewerElement) => {
        const details = (viewerElement as ViewerElement).viewerDetails;
        return details && details.viewer.loadingProgress === false && details.model !== null;
    }, viewerElementHandle);

    await expectScreenshotMatch(page, "viewer-reload.png");
});

// ============================================================
// Rendering Behavior
// ============================================================

test("isIdle state transitions", async ({ page }) => {
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

    // Wait for viewer to become idle
    await page.waitForFunction((viewerElement) => {
        return (viewerElement as ViewerElement).viewerDetails?.isIdle === true;
    }, viewerElementHandle);

    // Trigger a re-render by changing environment
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).viewerDetails?.markSceneMutated();
    }, viewerElementHandle);

    // Verify it eventually goes back to idle
    await page.waitForFunction((viewerElement) => {
        return (viewerElement as ViewerElement).viewerDetails?.isIdle === true;
    }, viewerElementHandle);
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

    // Change camera position
    await page.evaluate((viewerElement) => {
        const details = (viewerElement as ViewerElement).viewerDetails;
        if (details) {
            details.camera.radius = 0.001;
        }
    }, viewerElementHandle);

    // Reset the viewer
    await page.evaluate((viewerElement) => {
        (viewerElement as ViewerElement).reset();
    }, viewerElementHandle);

    // Wait for reset to complete and viewer to idle
    await expectScreenshotMatch(page, "viewer-reset.png");
});
