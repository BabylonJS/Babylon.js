import { test, expect, Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { ViewerElement } from "viewer/viewerElement";

// if running in the CI we need to use the babylon snapshot when loading the tools
const snapshot = process.env.SNAPSHOT ? "?snapshot=" + process.env.SNAPSHOT : "";
const viewerUrl =
    (process.env.VIEWER_BASE_URL || getGlobalConfig().baseUrl.replace(":1337", process.env.VIEWER_PORT || ":1342")) + "/packages/tools/viewer/test/apps/web/test.html" + snapshot;

async function attachViewerElement(page: Page, viewerHtml: string) {
    await page.goto(viewerUrl, {
        waitUntil: "networkidle",
    });

    await page.evaluate((viewerHtml) => {
        const container = document.createElement("div");
        container.innerHTML = viewerHtml;
        document.body.appendChild(container);
    }, viewerHtml);

    const viewerElementLocator = page.locator("babylon-viewer");
    await viewerElementLocator.waitFor();
    return await viewerElementLocator.elementHandle();
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
    expect(viewerDetails.getProperty("scene")).toBeDefined();
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

    // Wait for the viewerDetails property to become defined
    const selectedAnimation = await page.waitForFunction((viewerElement) => {
        const viewerDetails = (viewerElement as ViewerElement).viewerDetails;
        if (viewerDetails?.model) {
            return viewerDetails.viewer.selectedAnimation;
        }
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
    }, viewerElementHandle);

    expect(await cameraPose.jsonValue()).toEqual([1, 2, 0.1]);
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
    }, viewerElementHandle);

    expect(await toneMapping.jsonValue()).toEqual("none");
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
    }, viewerElementHandle);

    expect(await materialVariant.jsonValue()).toEqual("street");
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
});
