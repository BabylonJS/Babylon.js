import { test, type Page } from "@playwright/test";

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

/** A straight-alpha RGBA byte color. */
type RGBA = [number, number, number, number];

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
const evaluateRenderComposite = async (blendMode: number, layer0: RGBA, layer1: RGBA, premultiplyAlpha = false) => {
    return page.evaluate(
        async ({ blendMode, layer0, layer1, premultiplyAlpha }) => {
            const scene = (window as any).scene;
            const engine = (window as any).engine;
            const B = (window as any).BABYLON;

            // Generated solid-color PNG data URLs keep the test fully local. PNG stores straight
            // alpha; the MultiTexture upload path decodes it per premultiplyAlpha (createImageBitmap
            // with premultiplyAlpha "none" by default, "premultiply" when premultiplyAlpha is true),
            // so the sampled layers carry the requested alpha mode.
            const makeSolidPng = (r: number, g: number, b: number, a: number) => {
                const canvas = document.createElement("canvas");
                canvas.width = 8;
                canvas.height = 8;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
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
                    premultiplyAlpha,
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
            return { compileErr, compositeRGBA };
        },
        { blendMode, layer0, layer1, premultiplyAlpha }
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

/**
 * Asserts the presented center-cluster pixels AND the internal render target's composite RGBA
 * both match the expected composite color.
 *
 * The presented canvas is captured with page.screenshot() (the same capture path the visualization
 * suite uses, proven on both WebGL2 and WebGPU; in-browser drawImage of a WebGPU canvas is not
 * reliable, see evaluateRenderComposite notes). The composite is displayed with an opaque material
 * (blending disabled), so the presented RGB equals the composite's straight RGB with alpha dropped —
 * regardless of the composite alpha.
 *
 * The internal render target readback (compositeRGBA) covers the alpha channel directly and is the
 * shader's straight-RGBA output on both backends, so asserting it validates the per-channel blend
 * math including alpha (e.g. ALPHA_BLEND's alpha, MULTIPLY's absorbed alpha, SUBTRACT's zeroed
 * alpha) that presentation alone cannot observe.
 */
const assertCompositePixels = async (engineName: string, blendMode: number, expected: RGBA, layer0: RGBA, layer1: RGBA, premultiplyAlpha = false): Promise<void> => {
    const { compileErr, compositeRGBA } = (await evaluateRenderComposite(blendMode, layer0, layer1, premultiplyAlpha)) as unknown as {
        compileErr: string;
        compositeRGBA: number[];
    };
    const modeLabels: Record<number, string> = {
        [BABYLON_ALPHA_BLEND]: "ALPHA_BLEND",
        [BABYLON_ALPHA_MAX]: "ALPHA_MAX",
        [BABYLON_ADD]: "ADD",
        [BABYLON_MULTIPLY]: "MULTIPLY",
        [BABYLON_SUBTRACT]: "SUBTRACT",
        [BABYLON_SCREEN]: "SCREEN",
    };
    // Capture the presented frame with page.screenshot(): the same capture path the
    // visualization suite uses, proven on both WebGL2 and WebGPU (in-browser drawImage of a
    // WebGPU canvas is not reliable, see evaluateRenderComposite notes).
    const screenshot = await page.screenshot();
    const pixels = await decodeCenterPixels(screenshot.toString("base64"));

    // Collect every mismatched channel (presented RGB + internal composite RGBA readback) into one
    // message so a failure reports exactly which source/channel deviated and by how much, instead of
    // a bare vitest tolerance line.
    const failures: string[] = [];
    const compare = (label: string, channel: string, actual: unknown, exp: number) => {
        if (typeof actual !== "number") {
            failures.push(`${label}.${channel}=non-numeric (${String(actual)}), expected ${exp}`);
        } else if (Math.abs(actual - exp) > PIXEL_TOLERANCE) {
            failures.push(`${label}.${channel}=${actual} (expected ${exp}, tol ${PIXEL_TOLERANCE})`);
        }
    };
    const rgbLabels = ["r", "g", "b"];
    pixels.forEach(([r, g, b], i) => {
        [r, g, b].forEach((v, c) => compare(`presented[${i}]`, rgbLabels[c], v, expected[c]));
    });
    ["r", "g", "b", "a"].forEach((c, i) => compare("compositeRGBA", c, compositeRGBA[i], expected[i]));
    if (failures.length > 0) {
        throw new Error(
            `[${engineName}] ${modeLabels[blendMode] ?? blendMode}${premultiplyAlpha ? " premultiply" : ""} mismatch: ${failures.join("; ")}` +
                (compileErr ? ` (compile: ${compileErr})` : "")
        );
    }
};

export const evaluateMultiTextureTests = (engineName: string) => {
    test.describe("MultiTexture real-engine integration", () => {
        test.beforeEach(async ({ browser }) => {
            // A fresh page per test. MultiTexture allocates a WebGPU/WebGL2 2D-array render target per
            // instance that a shared page accumulates across the whole describe; after ~10 composites
            // the GPU device runs out of resources and `new MultiTexture` starts throwing (fast,
            // ~50ms, non-pixel failures). Recreating the page each test keeps each composite on a
            // clean device so the surface is deterministic and never resource-starved.
            page = await browser.newPage();
            await page.setViewportSize({ width: 16, height: 16 });
            await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
            await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
            await page.waitForFunction(() => (window as any).BABYLON);
            page.setDefaultTimeout(0);
            await page.evaluate(evaluateInitEngine, { engineName });
            await page.evaluate(evaluateCreateScene);
        });

        test.afterEach(async () => {
            await page.evaluate(evaluateDisposeEngine);
            await page.close();
        });

        test(`composites MULTIPLY layers to the expected pixel (${engineName})`, async () => {
            // Expected GPU output for layer0 * layer1 in 8-bit space.
            const expectByte = (a: number, b: number) => Math.round((a / 255) * (b / 255) * 255);
            const expected: RGBA = [expectByte(200, 90), expectByte(140, 160), expectByte(90, 220), 255];
            await assertCompositePixels(engineName, BABYLON_MULTIPLY, expected, [200, 140, 90, 255], [90, 160, 220, 255]);
        });

        // Low-intensity opaque colors so ADD does not saturate to white and every blend mode
        // yields a distinct, discriminating expected pixel. ALPHA_MAX ties (all-opaque layers)
        // resolve to the highest index, i.e. the last layer. Opaque layers composite to alpha 255
        // on every mode except SUBTRACT, which absorbs the previous layer's alpha (255 - 255 = 0).
        const opaque0: RGBA = [120, 80, 60, 255];
        const opaque1: RGBA = [100, 110, 70, 255];

        const blendExpectations: Array<{
            mode: number;
            label: string;
            expected: RGBA;
        }> = [
            { mode: BABYLON_ADD, label: "ADD", expected: [220, 190, 130, 255] },
            { mode: BABYLON_ALPHA_BLEND, label: "ALPHA_BLEND", expected: [100, 110, 70, 255] },
            { mode: BABYLON_ALPHA_MAX, label: "ALPHA_MAX", expected: [100, 110, 70, 255] },
            { mode: BABYLON_MULTIPLY, label: "MULTIPLY", expected: [47, 35, 16, 255] },
            { mode: BABYLON_SCREEN, label: "SCREEN", expected: [173, 155, 113, 255] },
            { mode: BABYLON_SUBTRACT, label: "SUBTRACT", expected: [20, 0, 0, 0] },
        ];

        for (const { mode, label, expected } of blendExpectations) {
            test(`composites ${label} layers (low-intensity opaque colors) to the expected RGBA pixel (${engineName})`, async () => {
                await assertCompositePixels(engineName, mode, expected, opaque0, opaque1);
            });
        }

        // Translucent (alpha < 255) layers so every blend mode is also validated for its alpha
        // behavior, not just its RGB: ALPHA_BLEND applies standard source-over compositing (the
        // 191-alpha layer drawn over the 128-alpha layer yields straight alpha 223), ALPHA_MAX
        // keeps the highest-alpha layer, MULTIPLY absorbs alpha, ADD adds-clamps, SUBTRACT zeroes
        // out the alpha, and SCREEN combines it. Expected values come from recomputing each
        // shader's fold in double precision on the straight-alpha inputs.
        const translucent0: RGBA = [150, 100, 60, 128];
        const translucent1: RGBA = [100, 90, 120, 191];

        // WebGL2 previously corrupted the ALPHA channel of straight-alpha (translucent) pixels on
        // layer upload: the image-source texSubImage3D path premultiplied by default and the driver's
        // unpremultiply rounded the recovered alpha up (MULTIPLY absorbed alpha read back as 112
        // instead of 96). The engine's updateTextureArrayLayerFromImageSourceExact now reads the
        // source's straight bytes and uploads them verbatim, so WebGL2 asserts the same canonical
        // output as WebGPU below.
        const translucentExpectations: Array<{
            mode: number;
            label: string;
            expected: RGBA; // canonical output (both engines)
        }> = [
            { mode: BABYLON_ALPHA_BLEND, label: "ALPHA_BLEND", expected: [107, 91, 111, 223] },
            { mode: BABYLON_ALPHA_MAX, label: "ALPHA_MAX", expected: [100, 90, 120, 191] },
            { mode: BABYLON_MULTIPLY, label: "MULTIPLY", expected: [59, 35, 28, 96] },
            { mode: BABYLON_SCREEN, label: "SCREEN", expected: [191, 155, 152, 223] },
            { mode: BABYLON_SUBTRACT, label: "SUBTRACT", expected: [50, 10, 0, 0] },
        ];

        for (const { mode, label, expected } of translucentExpectations) {
            test(`composites ${label} layers (translucent colors) to the expected RGBA pixel (${engineName})`, async () => {
                await assertCompositePixels(engineName, mode, expected, translucent0, translucent1);
            });
        }
        // premultiplyAlpha:true stores the layers premultiplied; the composite must still output the
        // SAME straight source-over pixel as straight storage ([107,91,111,223]) — the un-premultiply
        // is unconditional — so a material consuming the composite sees identical colors regardless
        // of the layer alpha mode.
        test(`composites ALPHA_BLEND premultiplied layers (translucent) to the same straight RGBA as straight storage (${engineName})`, async () => {
            await assertCompositePixels(engineName, BABYLON_ALPHA_BLEND, [107, 91, 111, 223], translucent0, translucent1, true);
        });
    });
};
