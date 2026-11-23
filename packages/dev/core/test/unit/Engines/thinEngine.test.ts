import { Engine } from "core/Engines/engine";
import { ThinEngine } from "core/Engines/thinEngine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Color4 } from "core/Maths/math.color";
import { Constants } from "core/Engines/constants";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Ray } from "core/Culling/ray";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";
import { CreateMockWebGL2Canvas } from "./mockWebGL2Canvas";
import "core/Engines/Extensions/engine.multiRender";

type RenderFrameCallback = (timestamp: number) => void;

describe("Engine", () => {
    describe("constructor", () => {
        it("sets adaptToDeviceRatio from engine options", () => {
            const engine = new Engine(null, undefined, { adaptToDeviceRatio: true });

            try {
                expect(engine.adaptToDeviceRatio).toBe(true);
            } finally {
                engine.dispose();
            }
        });

        it("sets useReverseDepthBuffer from engine options", () => {
            const engine = new Engine(null, undefined, { useReverseDepthBuffer: true });

            try {
                expect(engine.useReverseDepthBuffer).toBe(true);
                expect(engine.depthCullingState.depthFunc).toBe(Constants.GEQUAL);
            } finally {
                engine.dispose();
            }
        });

        it("keeps the standard depth buffer when useReverseDepthBuffer is omitted", () => {
            const engine = new Engine(null);

            try {
                expect(engine.useReverseDepthBuffer).toBe(false);
                expect(engine.depthCullingState.depthFunc).not.toBe(Constants.GEQUAL);
            } finally {
                engine.dispose();
            }
        });

        it("gives the same depth state as setting useReverseDepthBuffer after creation", () => {
            const fromOptions = new Engine(null, undefined, { useReverseDepthBuffer: true });
            const fromProperty = new Engine(null);

            try {
                fromProperty.useReverseDepthBuffer = true;

                expect(fromOptions.useReverseDepthBuffer).toBe(fromProperty.useReverseDepthBuffer);
                expect(fromOptions.depthCullingState.depthFunc).toBe(fromProperty.depthCullingState.depthFunc);
            } finally {
                fromOptions.dispose();
                fromProperty.dispose();
            }
        });

        describe("with a WebGL2 context", () => {
            beforeEach(() => {
                vi.stubGlobal("WebGL2RenderingContext", { SRGB: 0x8c40, SRGB8: 0x8c41, SRGB8_ALPHA8: 0x8c43 });
            });

            afterEach(() => {
                vi.unstubAllGlobals();
            });

            it.each([
                { options: { useReverseDepthBuffer: true }, expectedDepthFunc: Constants.GEQUAL, expectedName: "GEQUAL" },
                { options: { useReverseDepthBuffer: false }, expectedDepthFunc: Constants.LEQUAL, expectedName: "LEQUAL" },
                { options: {}, expectedDepthFunc: Constants.LEQUAL, expectedName: "LEQUAL" },
            ])("initializes the depth function to $expectedName with options $options", ({ options, expectedDepthFunc }) => {
                const { canvas, clear } = CreateMockWebGL2Canvas();
                const engine = new Engine(canvas, false, options);

                try {
                    expect(engine.webGLVersion).toBe(2);
                    expect(clear).not.toHaveBeenCalled();
                    expect(engine.useReverseDepthBuffer).toBe(!!options.useReverseDepthBuffer);
                    expect(engine.depthCullingState.depthFunc).toBe(expectedDepthFunc);
                } finally {
                    engine.dispose();
                }
            });

            it("only requests clip control when half-range depth is requested", () => {
                const { canvas, getExtension } = CreateMockWebGL2Canvas(true);
                const engine = new Engine(canvas, false, { useReverseDepthBuffer: true });
                try {
                    expect(getExtension).not.toHaveBeenCalledWith("EXT_clip_control");
                    expect(engine.isNDCHalfZRange).toBe(false);
                } finally {
                    engine.dispose();
                }
            });

            it("keeps full-range depth when the extension is unavailable", () => {
                const { canvas, getExtension } = CreateMockWebGL2Canvas();
                const engine = new Engine(canvas, false, { useNDCHalfZRange: true });
                try {
                    expect(getExtension).toHaveBeenCalledWith("EXT_clip_control");
                    expect(engine.isNDCHalfZRange).toBe(false);
                    expect(engine._getGlobalDefines()).not.toContain("IS_NDC_HALF_ZRANGE");
                } finally {
                    engine.dispose();
                }
            });

            it("leaves the clip range alone for a supplied WebGL context", () => {
                const { context, getExtension, clipControl } = CreateMockWebGL2Canvas(true);
                const engine = new Engine(context, false, { useNDCHalfZRange: true });
                try {
                    expect(engine.isNDCHalfZRange).toBe(false);
                    expect(getExtension).not.toHaveBeenCalledWith("EXT_clip_control");
                } finally {
                    engine.dispose();
                }
                expect(clipControl.clipControlEXT).not.toHaveBeenCalled();
            });

            it("keeps a half-range engine with context loss handling disabled suspended after a context loss", () => {
                const { canvas, clipControl, context, restoreContext } = CreateMockWebGL2Canvas(true);
                const engine = new Engine(canvas, false, { useNDCHalfZRange: true, doNotHandleContextLost: true });
                const render = vi.fn();
                const requestAnimationFrame = vi.fn<(_callback: RenderFrameCallback) => number>(() => 1);
                engine.customAnimationFrameRequester = { requestAnimationFrame, cancelAnimationFrame: vi.fn(), requestID: 0 };

                try {
                    expect(engine.isNDCHalfZRange).toBe(true);
                    engine.runRenderLoop(render);
                    requestAnimationFrame.mock.calls[0][0](1000);
                    expect(render).toHaveBeenCalledOnce();

                    expect(restoreContext()).toBe(false);
                    requestAnimationFrame.mock.calls[1][0](1016);
                    expect(render).toHaveBeenCalledOnce();
                    expect(clipControl.clipControlEXT).toHaveBeenCalledExactlyOnceWith(clipControl.LOWER_LEFT_EXT, clipControl.ZERO_TO_ONE_EXT);
                    expect(context.getParameter(clipControl.CLIP_DEPTH_MODE_EXT)).toBe(clipControl.NEGATIVE_ONE_TO_ONE_EXT);
                } finally {
                    engine.dispose();
                }
            });

            it("resets clip depth before disposal observers can create a replacement engine", () => {
                const { canvas, context, clipControl } = CreateMockWebGL2Canvas(true);
                const engine = new Engine(canvas, false, { useNDCHalfZRange: true });
                const onDispose = vi.fn(() => {
                    const depthAtHandoff = context.getParameter(clipControl.CLIP_DEPTH_MODE_EXT);
                    const replacement = new Engine(canvas, false, { useNDCHalfZRange: true });
                    return { depthAtHandoff, replacement };
                });
                engine.onDisposeObservable.addOnce(onDispose);
                engine.dispose();

                expect(onDispose).toHaveBeenCalledOnce();
                const { depthAtHandoff, replacement } = onDispose.mock.results[0].value;
                try {
                    expect(depthAtHandoff).toBe(clipControl.NEGATIVE_ONE_TO_ONE_EXT);
                    expect(replacement.isNDCHalfZRange).toBe(true);
                    expect(context.getParameter(clipControl.CLIP_DEPTH_MODE_EXT)).toBe(clipControl.ZERO_TO_ONE_EXT);
                    expect(clipControl.clipControlEXT.mock.calls).toEqual([
                        [clipControl.LOWER_LEFT_EXT, clipControl.ZERO_TO_ONE_EXT],
                        [clipControl.LOWER_LEFT_EXT, clipControl.NEGATIVE_ONE_TO_ONE_EXT],
                        [clipControl.LOWER_LEFT_EXT, clipControl.ZERO_TO_ONE_EXT],
                    ]);
                } finally {
                    replacement.dispose();
                }
            });

            it("detaches the canvas context handlers on disposal without a window", () => {
                const { canvas } = CreateMockWebGL2Canvas(true);
                const removeEventListener = vi.spyOn(canvas, "removeEventListener");
                const engine = new Engine(canvas, false, { useNDCHalfZRange: true });
                engine.dispose();

                expect(removeEventListener).toHaveBeenCalledWith("webglcontextlost", expect.any(Function));
                expect(removeEventListener).toHaveBeenCalledWith("webglcontextrestored", expect.any(Function));
                expect(canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }))).toBe(true);
            });

            it("restores the selected clip range before notifying context restoration", async () => {
                const { canvas, clipControl, restoreContext, getExtension } = CreateMockWebGL2Canvas(true);
                const engine = new Engine(canvas, false, { useNDCHalfZRange: true });
                try {
                    expect(engine.isNDCHalfZRange).toBe(true);
                    expect(engine.useReverseDepthBuffer).toBe(false);
                    expect(engine._getGlobalDefines()).toContain("#define IS_NDC_HALF_ZRANGE");
                    expect(clipControl.clipControlEXT).toHaveBeenCalledExactlyOnceWith(clipControl.LOWER_LEFT_EXT, clipControl.ZERO_TO_ONE_EXT);

                    const restored = new Promise<void>((resolve) => {
                        engine.onContextRestoredObservable.addOnce(() => resolve());
                    });
                    restoreContext();
                    await restored;
                    expect(clipControl.clipControlEXT).toHaveBeenCalledTimes(2);
                    expect(getExtension.mock.calls.filter(([name]) => name === "EXT_clip_control")).toHaveLength(2);
                } finally {
                    engine.dispose();
                }
            });

            it.each([
                { halfZRange: false, reverseDepth: false },
                { halfZRange: false, reverseDepth: true },
                { halfZRange: true, reverseDepth: false },
                { halfZRange: true, reverseDepth: true },
            ])("culls meshes at the camera depth limits (half range: $halfZRange, reversed Z: $reverseDepth)", ({ halfZRange, reverseDepth }) => {
                const { canvas } = CreateMockWebGL2Canvas(true);
                const engine = new Engine(canvas, false, { useNDCHalfZRange: halfZRange, useReverseDepthBuffer: reverseDepth });
                try {
                    const scene = new Scene(engine);
                    const camera = new FreeCamera("camera", Vector3.Zero(), scene);
                    scene.activeCamera = camera;
                    camera.minZ = 1;
                    camera.maxZ = 10;
                    scene.updateTransformMatrix();

                    const box = CreateBox("box", { size: 0.1 }, scene);
                    for (const [z, visible] of [
                        [0.75, false],
                        [5, true],
                        [11, false],
                    ] as const) {
                        box.position.z = z;
                        box.computeWorldMatrix(true);
                        expect([camera.isInFrustum(box), box.isInFrustum(scene.frustumPlanes)], `box at z=${z}`).toEqual([visible, visible]);
                    }

                    camera.maxZ = 0;
                    scene.updateTransformMatrix();
                    expect(camera.isInFrustum(box)).toBe(true);
                    expect(box.isInFrustum(scene.frustumPlanes)).toBe(true);

                    if (halfZRange && reverseDepth) {
                        box.scaling.setAll(0);
                        box.computeWorldMatrix(true);
                        expect([camera.isInFrustum(box), box.isInFrustum(scene.frustumPlanes)], "zero-extent bounds in the infinite frustum").toEqual([true, true]);
                    }
                } finally {
                    engine.dispose();
                }
            });

            it.each([false, true])("picks with the scene's depth range (half-range engine created first: %s)", (halfRangeFirst) => {
                const engines = [halfRangeFirst, !halfRangeFirst].map((useNDCHalfZRange) => {
                    const { canvas } = CreateMockWebGL2Canvas(true);
                    return new Engine(canvas, false, { useNDCHalfZRange });
                });

                try {
                    for (const engine of engines) {
                        const scene = new Scene(engine);
                        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
                        scene.activeCamera = camera;
                        camera.minZ = 1;
                        camera.maxZ = 10;

                        const box = CreateBox("box", { size: 0.1 }, scene);
                        box.position.z = 1.25;
                        box.computeWorldMatrix(true);

                        const x = engine.getRenderWidth() / 2;
                        const y = engine.getRenderHeight() / 2;
                        expect(scene.pick(x, y).pickedMesh).toBe(box);
                        expect(scene.createPickingRayInCameraSpace(x, y).origin.z).toBeCloseTo(1);

                        const distantRay = Ray.Zero();
                        scene.createPickingRayToRef(x, y, null, distantRay, camera, false, true);
                        expect(distantRay.origin.z).toBeCloseTo(1);
                    }
                } finally {
                    for (const engine of engines) {
                        engine.dispose();
                    }
                }
            });

            it.each([false, true])("projects an infinite reversed-Z frustum into [0, 1] (right-handed: %s)", (rightHanded) => {
                const { canvas } = CreateMockWebGL2Canvas(true);
                const engine = new Engine(canvas, false, { useNDCHalfZRange: true, useReverseDepthBuffer: true });
                try {
                    const scene = new Scene(engine);
                    scene.useRightHandedSystem = rightHanded;
                    const camera = new FreeCamera("camera", Vector3.Zero(), scene);
                    camera.minZ = 1;
                    camera.maxZ = 100;
                    camera.ignoreCameraMaxZ = true;
                    const projection = camera.getProjectionMatrix();

                    const forwardZ = rightHanded ? -1 : 1;
                    expect(Vector3.TransformCoordinates(new Vector3(0, 0, forwardZ), projection).z).toBe(1);
                    expect(Vector3.TransformCoordinates(new Vector3(0, 0, forwardZ * 1e9), projection).z).toBeCloseTo(1e-9, 15);
                } finally {
                    engine.dispose();
                }
            });
        });
    });
});

describe("ThinEngine", () => {
    describe("render loop", () => {
        it("uses the custom animation frame requester from AbstractEngine", () => {
            const thinEngine = new ThinEngine(null);
            const requestedCallbacks: RenderFrameCallback[] = [];
            const canceledRequestIds: Array<number | undefined> = [];
            let nextRequestId = 7;
            let renderCount = 0;
            const renderLoop = () => {
                renderCount++;
            };

            thinEngine.customAnimationFrameRequester = {
                requestAnimationFrame: (callback: RenderFrameCallback) => {
                    requestedCallbacks.push(callback);
                    return nextRequestId++;
                },
                cancelAnimationFrame: (requestId?: number) => {
                    canceledRequestIds.push(requestId);
                },
            };

            try {
                thinEngine.runRenderLoop(renderLoop);

                expect(requestedCallbacks).toHaveLength(1);
                expect(thinEngine._frameHandler).toBe(7);
                expect(thinEngine.customAnimationFrameRequester.requestID).toBe(7);

                requestedCallbacks[0](1000);

                expect(renderCount).toBe(1);
                expect(requestedCallbacks).toHaveLength(2);
                expect(thinEngine._frameHandler).toBe(8);
                expect(thinEngine.customAnimationFrameRequester.requestID).toBe(8);

                thinEngine.stopRenderLoop(renderLoop);

                expect(canceledRequestIds).toEqual([8]);
                expect(thinEngine._frameHandler).toBe(0);
                expect(thinEngine.customAnimationFrameRequester.requestID).toBeUndefined();
            } finally {
                thinEngine.dispose();
            }
        });
    });

    describe("getTexImageParametersForCreateTexture", () => {
        let thinEngine: ThinEngine;

        beforeEach(() => {
            const fakeConstProvider: any = new Proxy(
                {},
                {
                    get: (_, propertyName) => {
                        return propertyName;
                    },
                }
            );
            thinEngine = new ThinEngine(null);
            thinEngine._gl = fakeConstProvider;
            thinEngine._glSRGBExtensionValues = fakeConstProvider;
        });

        it("gets tex image parameters for WebGL 1", () => {
            expect.hasAssertions();
            checkFormats(
                ["TEXTUREFORMAT_ALPHA", "TEXTUREFORMAT_LUMINANCE", "TEXTUREFORMAT_LUMINANCE_ALPHA", "TEXTUREFORMAT_RGB", "TEXTUREFORMAT_RGBA"],
                `
Babylon format                SRGB  Int. format     Format          Type
==============                ====  ===========     ======          ====
TEXTUREFORMAT_ALPHA           false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_RGB             false RGB             RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             true  SRGB            SRGB            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            false RGBA            RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            true  SRGB8_ALPHA8    SRGB8_ALPHA8    UNSIGNED_BYTE`.trimStart()
            );
        });

        it("gets tex image parameters for WebGL 2", () => {
            expect.hasAssertions();
            thinEngine._webGLVersion = 2;
            checkFormats(
                [
                    "TEXTUREFORMAT_ALPHA",
                    "TEXTUREFORMAT_LUMINANCE",
                    "TEXTUREFORMAT_LUMINANCE_ALPHA",
                    "TEXTUREFORMAT_R",
                    "TEXTUREFORMAT_RED",
                    "TEXTUREFORMAT_RG",
                    "TEXTUREFORMAT_RGB",
                    "TEXTUREFORMAT_RGBA",
                    "TEXTUREFORMAT_R_INTEGER",
                    "TEXTUREFORMAT_RG_INTEGER",
                    "TEXTUREFORMAT_RED_INTEGER",
                    "TEXTUREFORMAT_RGB_INTEGER",
                    "TEXTUREFORMAT_RGBA_INTEGER",
                ],
                `
Babylon format                SRGB  Int. format     Format          Type
==============                ====  ===========     ======          ====
TEXTUREFORMAT_ALPHA           false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_R               false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_R               true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RG              false RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RG              true  RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RGB             false RGB8            RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             true  SRGB8           RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            false RGBA8           RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            true  SRGB8_ALPHA8    RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      false RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      true  RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     false RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     true  RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    false RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    true  RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE`.trimStart()
            );
        });

        function checkFormats(formatStrs: string[], expected: string) {
            const results = [
                "Babylon format                SRGB  Int. format     Format          Type",
                "==============                ====  ===========     ======          ====",
            ];
            for (const formatStr of formatStrs) {
                const format = (Engine as any)[formatStr];
                for (const useSRGBBuffer of [false, true]) {
                    const texImageParams = thinEngine._getTexImageParametersForCreateTexture(format, useSRGBBuffer);
                    results.push(
                        formatStr.padEnd(30) +
                            useSRGBBuffer.toString().padEnd(6) +
                            (texImageParams.internalFormat as any).padEnd(16) +
                            (texImageParams.format as any).padEnd(16) +
                            texImageParams.type
                    );
                }
            }
            expect(results.join("\n")).toEqual(expected);
        }
    });

    describe("clearColorAttachment", () => {
        it("uses an unsigned integer clear for R8UI attachments", () => {
            const thinEngine = new ThinEngine(null);
            const clearBufferuiv = vi.fn();
            thinEngine._gl = {
                COLOR: 0x1800,
                clearBufferuiv,
            } as unknown as WebGLRenderingContext;

            thinEngine._clearColorAttachment(3, new Color4(7, 0, 0, 0), Engine.TEXTUREFORMAT_RED_INTEGER, Engine.TEXTURETYPE_UNSIGNED_BYTE);

            expect(clearBufferuiv).toHaveBeenCalledOnce();
            expect(clearBufferuiv.mock.calls[0][0]).toBe(0x1800);
            expect(clearBufferuiv.mock.calls[0][1]).toBe(3);
            expect(Array.from(clearBufferuiv.mock.calls[0][2] as Uint32Array)).toEqual([7, 0, 0, 0]);
        });

        it("clears mixed MRT attachments according to each texture format", () => {
            const thinEngine = new ThinEngine(null);
            const clearBufferfv = vi.fn();
            const clearBufferuiv = vi.fn();
            const drawBuffers = vi.fn();
            thinEngine._webGLVersion = 2;
            thinEngine._gl = {
                COLOR: 0x1800,
                NONE: 0,
                clearBufferfv,
                clearBufferuiv,
                colorMask: vi.fn(),
                drawBuffers,
            } as unknown as WebGLRenderingContext;
            thinEngine._currentRenderTarget = {
                textures: [
                    { format: Engine.TEXTUREFORMAT_RGBA, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                    { format: Engine.TEXTUREFORMAT_RED_INTEGER, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                ],
            } as any;

            thinEngine.clearAttachments(new Color4(1, 0, 0, 0), [1, 2], true, false);

            expect(drawBuffers).toHaveBeenCalledWith([1, 2]);
            expect(clearBufferfv).toHaveBeenCalledOnce();
            expect(clearBufferfv.mock.calls[0][1]).toBe(0);
            expect(clearBufferuiv).toHaveBeenCalledOnce();
            expect(clearBufferuiv.mock.calls[0][1]).toBe(1);
            expect(Array.from(clearBufferuiv.mock.calls[0][2] as Uint32Array)).toEqual([255, 0, 0, 0]);
            expect(thinEngine._integerMRTAttachmentsMask).toBe(1 << 1);
        });

        it("applies a pending color-write state before clearing mixed MRT attachments", () => {
            const thinEngine = new ThinEngine(null);
            const clearBufferfv = vi.fn();
            const clearBufferuiv = vi.fn();
            const colorMask = vi.fn();
            thinEngine._webGLVersion = 2;
            thinEngine._gl = {
                COLOR: 0x1800,
                NONE: 0,
                clearBufferfv,
                clearBufferuiv,
                colorMask,
                drawBuffers: vi.fn(),
            } as unknown as WebGLRenderingContext;
            thinEngine._currentRenderTarget = {
                textures: [
                    { format: Engine.TEXTUREFORMAT_RGBA, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                    { format: Engine.TEXTUREFORMAT_RED_INTEGER, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                ],
            } as any;

            thinEngine.setColorWrite(false);
            thinEngine._applyColorWriteState();
            thinEngine.setColorWrite(true);
            thinEngine.clearAttachments(new Color4(1, 0, 0, 0), [1, 2], true, false);

            expect(colorMask).toHaveBeenLastCalledWith(true, true, true, true);
            expect(colorMask.mock.invocationCallOrder[1]).toBeLessThan(clearBufferfv.mock.invocationCallOrder[0]);
            expect(colorMask.mock.invocationCallOrder[1]).toBeLessThan(clearBufferuiv.mock.invocationCallOrder[0]);
        });

        it("uses an unsigned clear for packed RGB10_A2UI attachments", () => {
            const thinEngine = new ThinEngine(null);
            const clearBufferuiv = vi.fn();
            thinEngine._gl = {
                COLOR: 0x1800,
                clearBufferuiv,
            } as unknown as WebGLRenderingContext;

            thinEngine._clearColorAttachment(0, new Color4(1, 2, 3, 4), Engine.TEXTUREFORMAT_RGBA_INTEGER, Engine.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV);

            expect(clearBufferuiv).toHaveBeenCalledOnce();
            expect(Array.from(clearBufferuiv.mock.calls[0][2] as Uint32Array)).toEqual([1, 2, 3, 4]);
        });

        it("clears mixed MRT attachments with stale alpha state and no indexed blending", () => {
            const thinEngine = new ThinEngine(null);
            const clearBufferfv = vi.fn();
            const clearBufferuiv = vi.fn();
            const clear = vi.fn();
            const enable = vi.fn();
            thinEngine._webGLVersion = 2;
            thinEngine._gl = {
                BLEND: 0x0be2,
                COLOR: 0x1800,
                DEPTH_BUFFER_BIT: 0x0100,
                NONE: 0,
                clear,
                clearBufferfv,
                clearBufferuiv,
                clearDepth: vi.fn(),
                colorMask: vi.fn(),
                drawBuffers: vi.fn(),
                enable,
            } as unknown as WebGLRenderingContext;
            thinEngine._currentRenderTarget = {
                textures: [
                    { format: Engine.TEXTUREFORMAT_RGBA, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                    { format: Engine.TEXTUREFORMAT_RED_INTEGER, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                ],
            } as any;
            thinEngine.alphaState.setAlphaBlend(true);
            vi.spyOn(thinEngine.depthCullingState, "apply").mockImplementation(() => {});
            vi.spyOn(thinEngine.stencilStateComposer, "apply").mockImplementation(() => {});

            expect(() => thinEngine.clearAttachments(new Color4(1, 0, 0, 0), [1, 2], true, true)).not.toThrow();
            expect(clearBufferfv).toHaveBeenCalledOnce();
            expect(clearBufferuiv).toHaveBeenCalledOnce();
            expect(clear).toHaveBeenCalledWith(0x0100);
            expect(enable).toHaveBeenCalledWith(0x0be2);
        });

        it("uses the WebGL1-compatible MRT clear path", () => {
            const thinEngine = new ThinEngine(null);
            const color = new Color4(1, 0, 0, 0);
            thinEngine._webGLVersion = 1;
            thinEngine._gl = { NONE: 0 } as unknown as WebGLRenderingContext;
            thinEngine._currentRenderTarget = {
                textures: [
                    { format: Engine.TEXTUREFORMAT_RGBA, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                    { format: Engine.TEXTUREFORMAT_RGBA, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                ],
            } as any;
            const bindAttachments = vi.spyOn(thinEngine, "bindAttachments").mockImplementation(() => {});
            const clear = vi.spyOn(thinEngine, "clear").mockImplementation(() => {});
            const clearColorAttachment = vi.spyOn(thinEngine, "_clearColorAttachment");

            thinEngine.clearAttachments(color, [1, 2], true, true, true, 7);

            expect(bindAttachments).toHaveBeenCalledExactlyOnceWith([1, 2]);
            expect(clear).toHaveBeenCalledExactlyOnceWith(color, true, true, true, 7);
            expect(clearColorAttachment).not.toHaveBeenCalled();
        });

        it("uses the shared MRT clear path for non-integer WebGL2 attachments", () => {
            const thinEngine = new ThinEngine(null);
            const color = new Color4(1, 0, 0, 0);
            thinEngine._webGLVersion = 2;
            thinEngine._gl = { NONE: 0 } as unknown as WebGLRenderingContext;
            thinEngine._currentRenderTarget = {
                textures: [
                    { format: Engine.TEXTUREFORMAT_RGBA, type: Engine.TEXTURETYPE_UNSIGNED_BYTE },
                    { format: Engine.TEXTUREFORMAT_RGBA, type: Engine.TEXTURETYPE_HALF_FLOAT },
                ],
            } as any;
            const bindAttachments = vi.spyOn(thinEngine, "bindAttachments").mockImplementation(() => {});
            const clear = vi.spyOn(thinEngine, "clear").mockImplementation(() => {});
            const clearColorAttachment = vi.spyOn(thinEngine, "_clearColorAttachment");

            thinEngine.clearAttachments(color, [1, 2], true, true);

            expect(bindAttachments).toHaveBeenCalledExactlyOnceWith([1, 2]);
            expect(clear).toHaveBeenCalledExactlyOnceWith(color, true, true, false, 0);
            expect(clearColorAttachment).not.toHaveBeenCalled();
        });

        it("rejects integer MRT attachments on WebGL1", () => {
            const thinEngine = new ThinEngine(null);
            thinEngine._webGLVersion = 1;
            thinEngine._gl = { NONE: 0 } as unknown as WebGLRenderingContext;
            thinEngine._currentRenderTarget = {
                textures: [{ format: Engine.TEXTUREFORMAT_RED_INTEGER, type: Engine.TEXTURETYPE_UNSIGNED_BYTE }],
            } as any;

            expect(() => thinEngine.clearAttachments(new Color4(1, 0, 0, 0), [1], true, false)).toThrow("integer MRT attachments require WebGL2");
        });
    });
});
