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
            source="https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/ufo.glb"
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

test("camera-orbit", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/ufo.glb"
            camera-orbit="1 2 3"
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

    expect(await cameraPose.jsonValue()).toEqual([1, 2, 3]);
});

test("camera-target", async ({ page }) => {
    const viewerElementHandle = await attachViewerElement(
        page,
        `
        <babylon-viewer
            source="https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/ufo.glb"
            camera-target="1 2 3"
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
