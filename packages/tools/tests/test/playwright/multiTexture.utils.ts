import { test, expect, type Page } from "@playwright/test";

import { getGlobalConfig, evaluateInitEngine, evaluateCreateScene, evaluateDisposeEngine } from "@tools/test-tools";

/**
 * Shared real-engine integration tests for MultiTexture.
 *
 * This mirrors the repository's dual-engine visualization pattern
 * (visualization.webgl2.test.ts / visualization.webgpu.test.ts): a single runner
 * is invoked once per engine from thin wrapper test files. Each wrapper runs under
 * a dedicated Playwright project (webgl2 / webgpu) that supplies a real WebGL2 or
 * WebGPU capable browser.
 *
 * The test builds a MultiTexture from two generated solid-color layers, composites
 * them on the real GPU (compiling the real blend shaders, uploading a real texture
 * array), then displays the result on a full-screen emissive plane and reads the
 * presented canvas back as pixels. This validates that both engines compile and run
 * the composite shaders and reproduce the exact expected blend output. Reading the
 * composited pixels off the presented canvas (rather than via the procedural render
 * target's async readback) makes the assertion deterministic and identical on both
 * WebGL2 and WebGPU.
 */

/** Per-channel tolerance; covers 8-bit rounding on the capture pipeline. */
const PIXEL_TOLERANCE = 6;

let page: Page;

/**
 * Runs in the browser: builds the MultiTexture from two local data-URL PNGs, drives a
 * real render loop until the composite shader is ready, displays it full-screen on an
 * emissive plane, then reads the presented canvas back to pixels — all within the same
 * script tick so the WebGL drawing buffer is still valid. Returns the center cluster of
 * pixels so the Node-side assertion is trivial and deterministic.
 *
 * The plane's emissive color is black so the emissive term equals the texture sample
 * alone (without an emissive color, StandardMaterial adds color + texture and would
 * saturate to white).
 */
const evaluateRenderComposite = async (): Promise<number[][]> => {
    return page.evaluate(async () => {
        const scene = (window as any).scene;
        const engine = (window as any).engine;
        const B = (window as any).BABYLON;

        // Two opaque mid-range colors; their MULTIPLY is neither black nor white.
        const layer0: [number, number, number] = [200, 140, 90];
        const layer1: [number, number, number] = [90, 160, 220];

        // Generated solid-color PNG data URLs keep the test fully local.
        const makeSolidPng = (r: number, g: number, b: number) => {
            const canvas = document.createElement("canvas");
            canvas.width = 8;
            canvas.height = 8;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(0, 0, 8, 8);
            return canvas.toDataURL("image/png");
        };

        // MultiTexture is not registered in scene.proceduralTextures: it composes an internal
        // render target (skipSceneRegistration) that re-composites itself after each mutation, so
        // keep a direct handle to the instance.
        let mt: any;
        const onLoad = new Promise<void>((resolve) => {
            mt = new B.MultiTexture("multi", [makeSolidPng(...layer0), makeSolidPng(...layer1)], scene, {
                width: 8,
                height: 8,
                blendMode: B.MultiBlendMode.MULTIPLY,
                onLoad: () => resolve(),
            });
        });
        await onLoad;

        // Track any composite shader compile errors so a driver that fails to compile
        // surfaces a clear message rather than an unexplained wrong pixel.
        const errors: string[] = [];
        (engine.onEffectErrorObservable ?? { add: () => {} }).add((e: any) => errors.push(String(e?.errors ?? "")));

        // Display the composite full-screen. The emissive color must be black so the
        // emissive term resolves to the texture sample alone.
        const mat = new B.StandardMaterial("display", scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(0, 0, 0);
        mat.emissiveTexture = mt;

        // Orthographic camera sized to the clip space so the plane fills the whole canvas.
        const camera = new B.FreeCamera("cam", new B.Vector3(0, 0, -10), scene);
        camera.mode = B.Camera.ORTHOGRAPHIC_CAMERA;
        camera.orthoLeft = -1;
        camera.orthoRight = 1;
        camera.orthoTop = 1;
        camera.orthoBottom = -1;
        scene.activeCamera = camera;
        B.MeshBuilder.CreatePlane("displayPlane", { width: 2, height: 2 }, scene).material = mat;

        // The composite shader is imported/compiled asynchronously, so render frames and
        // poll readiness (mirroring the initialization the public API performs).
        let ready = false;
        let frames = 0;
        await new Promise<void>((resolve) => {
            const renderLoop = () => {
                scene.render();
                frames++;
                if (!ready && mt.isReady()) {
                    ready = true;
                }
                if (ready && frames >= 60) {
                    engine.stopRenderLoop(renderLoop);
                    resolve();
                } else if (frames >= 600) {
                    engine.stopRenderLoop(renderLoop);
                    resolve();
                }
            };
            engine.runRenderLoop(renderLoop);
        });
        if (!ready) {
            throw new Error(
                "MultiTexture composite shader never became ready. Compile errors: " +
                    (errors.join(" | ") || "(none reported)")
            );
        }

        // Read the presented frame back in the same tick while the drawing buffer is valid.
        const webglCanvas = document.getElementById("babylon-canvas") as HTMLCanvasElement;
        const readback = document.createElement("canvas");
        readback.width = webglCanvas.width;
        readback.height = webglCanvas.height;
        const ctx = readback.getContext("2d")!;
        ctx.drawImage(webglCanvas, 0, 0);
        const { data, width, height } = ctx.getImageData(0, 0, readback.width, readback.height);

        const cx = (width / 2) | 0;
        const cy = (height / 2) | 0;
        const pixels: number[][] = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const i = ((cy + dy) * width + (cx + dx)) * 4;
                pixels.push([data[i], data[i + 1], data[i + 2]]);
            }
        }
        return pixels;
    });
};

/** Asserts every returned center-cluster pixel equals the expected composite color. */
const assertCompositePixels = async (expectedR: number, expectedG: number, expectedB: number): Promise<void> => {
    const pixels = await evaluateRenderComposite();
    for (const [r, g, b] of pixels) {
        expect(Math.abs(r - expectedR)).toBeLessThanOrEqual(PIXEL_TOLERANCE);
        expect(Math.abs(g - expectedG)).toBeLessThanOrEqual(PIXEL_TOLERANCE);
        expect(Math.abs(b - expectedB)).toBeLessThanOrEqual(PIXEL_TOLERANCE);
    }
};

export const evaluateMultiTextureTests = (engineName: string) => {
    test.describe("MultiTexture real-engine integration", () => {
        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.setViewportSize({ width: 16, height: 16 });
            await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
            await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
            await page.waitForFunction(() => (window as any).BABYLON);
            page.setDefaultTimeout(0);
        });

        test.beforeEach(async () => {
            await page.evaluate(evaluateInitEngine, { engineName });
            await page.evaluate(evaluateCreateScene);
        });

        test.afterEach(async () => {
            await page.evaluate(evaluateDisposeEngine);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test(`composites MULTIPLY layers to the expected pixel (${engineName})`, async () => {
            // Expected GPU output for layer0 * layer1 in 8-bit space.
            const expectByte = (a: number, b: number) => Math.round((a / 255) * (b / 255) * 255);
            const expR = expectByte(200, 90);
            const expG = expectByte(140, 160);
            const expB = expectByte(90, 220);

            await assertCompositePixels(expR, expG, expB);
        });
    });
};
