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

// Numeric MultiBlendMode values (mirror MultiBlendMode in multiTexture.pure.ts) so the
// Node-side runner can pass the mode into the browser without importing the pure module.
const BABYLON_ALPHA_BLEND = 0;
const BABYLON_ALPHA_MAX = 1;
const BABYLON_ADD = 2;
const BABYLON_MULTIPLY = 3;
const BABYLON_SUBTRACT = 4;
const BABYLON_SCREEN = 5;

let page: Page;

/**
 * Runs in the browser: builds the MultiTexture from two local data-URL PNGs, drives a
 * real render loop until the composite shader is compiled (effect readiness, which the
 * public API guarantees), displays the composite full-screen on an emissive plane, and
 * returns the internal render-target's composite pixels for diagnostics.
 *
 * The composite is performed asynchronously (the shader compiles and the internal render
 * target re-composites during the first frames), so instead of a fixed frame count we keep
 * rendering a generous number of frames after the composite is ready so its color is
 * actually presented before the test captures the canvas. If readiness never happens, the
 * browser-side readback throws with any reported shader compile errors.
 *
 * The plane's emissive color is black so the emissive term equals the texture sample
 * alone (without an emissive color, StandardMaterial adds color + texture and would
 * saturate to white).
 *
 * The final presented pixels are NOT read here: reading a WebGPU canvas back through a 2D
 * context's drawImage is not reliable (headless Chrome returns a stale/black frame, and a
 * premultiplied-alpha drawImage of a remote GPU surface can zero RGB channels when the
 * composite's alpha is 0, as SUBTRACT produces). Instead the Node-side assertion captures
 * the presented frame with page.screenshot() — the same capture path the visualization
 * suite uses, proven on both WebGL2 and WebGPU — and decodes its PNG bytes.
 */
const evaluateRenderComposite = async (blendMode: number, layer0: [number, number, number], layer1: [number, number, number]) => {
    return page.evaluate(
        async ({ blendMode, layer0, layer1 }) => {
            const scene = (window as any).scene;
            const engine = (window as any).engine;
            const B = (window as any).BABYLON;

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
                    blendMode,
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
            // poll readiness (mirroring the initialization the public API performs), then keep
            // rendering a generous number of frames after the composite is ready so its color is
            // actually presented before the one-time readback below.
            let ready = false;
            let frames = 0;
            await new Promise<void>((resolve) => {
                const renderLoop = () => {
                    scene.render();
                    frames++;
                    if (!ready && mt.isReady()) {
                        ready = true;
                    }
                    if (ready && frames >= 120) {
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
                throw new Error("MultiTexture composite shader never became ready. Compile errors: " + (errors.join(" | ") || "(none reported)"));
            }

            // Diagnostics: read the composite render target's center texel back directly. This is
            // for the DIAG log only — the assertion runs against the presented pixels captured
            // via page.screenshot() on the Node side.
            let compositeRGBA: number[] = [];
            try {
                const content = await (mt as any).composite.getContent();
                const arr = content as ArrayBufferView;
                const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
                const half = Math.floor(bytes.length / 2);
                const k = Math.floor(half / 4) * 4;
                compositeRGBA = [bytes[k], bytes[k + 1], bytes[k + 2], bytes[k + 3]];
            } catch (e) {
                compositeRGBA = [999, String((e as Error)?.message ?? e).slice(0, 60) as any];
            }
            let compileErr = "";
            try {
                const eff = (mt as any).composite.getEffect?.();
                compileErr = eff?.getCompilationError?.() ?? "(no effect)";
            } catch (e) {
                compileErr = "err:" + String((e as Error)?.message ?? e).slice(0, 60);
            }
            compositeRGBA.push(compileErr.length);
            return { compileErr, compositeRGBA };
        },
        { blendMode, layer0, layer1 }
    );
};

/**
 * Decodes a screenshot PNG in the browser and returns the RGB of the 3x3 center cluster.
 * Runs inside the page so no PNG dependency is needed on the Node side.
 */
const decodeCenterPixels = async (screenshotBase64: string): Promise<number[][]> => {
    return page.evaluate(async (b64) => {
        const blob = await (await fetch("data:image/png;base64," + b64)).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

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
    }, screenshotBase64);
};

/** Asserts the presented center-cluster pixels equal the expected composite color. */
const assertCompositePixels = async (blendMode: number, expected: [number, number, number], layer0: [number, number, number], layer1: [number, number, number]): Promise<void> => {
    const { compileErr, compositeRGBA } = (await evaluateRenderComposite(blendMode, layer0, layer1)) as unknown as { compileErr: string; compositeRGBA: number[] };
    // Capture the presented frame with page.screenshot(): the same capture path the
    // visualization suite uses, proven on both WebGL2 and WebGPU (in-browser drawImage of a
    // WebGPU canvas is not reliable, see evaluateRenderComposite notes).
    const screenshot = await page.screenshot();
    const pixels = await decodeCenterPixels(screenshot.toString("base64"));
    console.log("DIAG compositeRGBA", JSON.stringify(compositeRGBA), "pixels0", JSON.stringify(pixels[0]), "compileErr", JSON.stringify(compileErr));
    for (const [r, g, b] of pixels) {
        expect(Math.abs(r - expected[0])).toBeLessThanOrEqual(PIXEL_TOLERANCE);
        expect(Math.abs(g - expected[1])).toBeLessThanOrEqual(PIXEL_TOLERANCE);
        expect(Math.abs(b - expected[2])).toBeLessThanOrEqual(PIXEL_TOLERANCE);
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
            // evaluateDisposeEngine nulls window.engine but NOT window.scene, and
            // evaluateCreateScene only creates a scene when window.scene is falsy — a stale
            // disposed scene from a prior test would otherwise be reused and render nothing.
            await page.evaluate(() => {
                (window as any).scene?.dispose();
                (window as any).scene = null;
            });
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
            const expected: [number, number, number] = [expectByte(200, 90), expectByte(140, 160), expectByte(90, 220)];
            await assertCompositePixels(BABYLON_MULTIPLY, expected, [200, 140, 90], [90, 160, 220]);
        });

        // Low-intensity opaque colors so ADD does not saturate to white and every blend mode
        // yields a distinct, discriminating expected pixel. ALPHA_MAX ties (all-opaque layers)
        // resolve to the highest index, i.e. the last layer.
        const opaque0: [number, number, number] = [120, 80, 60];
        const opaque1: [number, number, number] = [100, 110, 70];

        const blendExpectations: Array<{
            mode: number;
            label: string;
            expected: [number, number, number];
        }> = [
            { mode: BABYLON_ADD, label: "ADD", expected: [220, 190, 130] },
            { mode: BABYLON_ALPHA_BLEND, label: "ALPHA_BLEND", expected: [100, 110, 70] },
            { mode: BABYLON_ALPHA_MAX, label: "ALPHA_MAX", expected: [100, 110, 70] },
            { mode: BABYLON_MULTIPLY, label: "MULTIPLY", expected: [47, 35, 16] },
            { mode: BABYLON_SCREEN, label: "SCREEN", expected: [173, 155, 113] },
            { mode: BABYLON_SUBTRACT, label: "SUBTRACT", expected: [20, 0, 0] },
        ];

        for (const { mode, label, expected } of blendExpectations) {
            test(`composites ${label} layers (low-intensity colors) to the expected pixel (${engineName})`, async () => {
                await assertCompositePixels(mode, expected, opaque0, opaque1);
            });
        }
    });
};
