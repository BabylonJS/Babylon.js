/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRWebGLGraphicsBinding, WebXRWebGPUGraphicsBinding } from "core/XR/webXRGraphicsBinding";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

describe("WebXRSessionManager", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("construction", () => {
        it("stores the scene reference", () => {
            expect(sessionManager.scene).toBe(scene);
        });

        it("starts not in XR session", () => {
            expect(sessionManager.inXRSession).toBe(false);
        });

        it("starts not in XR frame loop", () => {
            expect(sessionManager.inXRFrameLoop).toBe(false);
        });

        it("has a default height compensation of 1.7", () => {
            expect(sessionManager.defaultHeightCompensation).toBe(1.7);
        });

        it("has a default timestamp of -1", () => {
            expect(sessionManager.currentTimestamp).toBe(-1);
        });

        it("has undefined currentFrame by default", () => {
            expect(sessionManager.currentFrame).toBeUndefined();
        });
    });

    describe("observables", () => {
        it("has onXRFrameObservable", () => {
            expect(sessionManager.onXRFrameObservable).toBeDefined();
            expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(false);
        });

        it("has onXRSessionEnded", () => {
            expect(sessionManager.onXRSessionEnded).toBeDefined();
        });

        it("has onXRSessionInit", () => {
            expect(sessionManager.onXRSessionInit).toBeDefined();
        });

        it("has onXRReferenceSpaceChanged", () => {
            expect(sessionManager.onXRReferenceSpaceChanged).toBeDefined();
        });

        it("has onXRReferenceSpaceInitialized", () => {
            expect(sessionManager.onXRReferenceSpaceInitialized).toBeDefined();
        });

        it("has onXRReady", () => {
            expect(sessionManager.onXRReady).toBeDefined();
        });

        it("has onWorldScaleFactorChangedObservable", () => {
            expect(sessionManager.onWorldScaleFactorChangedObservable).toBeDefined();
        });
    });

    describe("worldScalingFactor", () => {
        it("defaults to 1", () => {
            expect(sessionManager.worldScalingFactor).toBe(1);
        });

        it("can be set", () => {
            sessionManager.worldScalingFactor = 2;
            expect(sessionManager.worldScalingFactor).toBe(2);
        });

        it("notifies observers when changed", () => {
            const callback = vi.fn();
            sessionManager.onWorldScaleFactorChangedObservable.add(callback);

            sessionManager.worldScalingFactor = 3;

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ previousScaleFactor: 1, newScaleFactor: 3 }, expect.anything());
        });

        it("notifies observers even when set to the same value", () => {
            const callback = vi.fn();
            sessionManager.onWorldScaleFactorChangedObservable.add(callback);

            sessionManager.worldScalingFactor = 1;

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ previousScaleFactor: 1, newScaleFactor: 1 }, expect.anything());
        });

        it("tracks previous scale factor correctly across multiple changes", () => {
            const values: Array<{ previousScaleFactor: number; newScaleFactor: number }> = [];
            sessionManager.onWorldScaleFactorChangedObservable.add((data) => {
                values.push({ ...data });
            });

            sessionManager.worldScalingFactor = 2;
            sessionManager.worldScalingFactor = 5;
            sessionManager.worldScalingFactor = 0.5;

            expect(values).toEqual([
                { previousScaleFactor: 1, newScaleFactor: 2 },
                { previousScaleFactor: 2, newScaleFactor: 5 },
                { previousScaleFactor: 5, newScaleFactor: 0.5 },
            ]);
        });
    });

    describe("referenceSpace", () => {
        it("notifies onXRReferenceSpaceChanged when referenceSpace is set", () => {
            const callback = vi.fn();
            sessionManager.onXRReferenceSpaceChanged.add(callback);

            const mockSpace = {} as XRReferenceSpace;
            sessionManager.referenceSpace = mockSpace;

            expect(callback).toHaveBeenCalledTimes(1);
            expect(sessionManager.referenceSpace).toBe(mockSpace);
        });

        it("resetReferenceSpace sets referenceSpace back to baseReferenceSpace", () => {
            const baseSpace = {} as XRReferenceSpace;
            const offsetSpace = {} as XRReferenceSpace;

            sessionManager.baseReferenceSpace = baseSpace;
            sessionManager.referenceSpace = offsetSpace;

            expect(sessionManager.referenceSpace).toBe(offsetSpace);

            sessionManager.resetReferenceSpace();

            expect(sessionManager.referenceSpace).toBe(baseSpace);
        });
    });

    describe("sessionMode", () => {
        it("returns the session mode", () => {
            // sessionMode is set when initializeSessionAsync is called; it's undefined initially
            expect(sessionManager.sessionMode).toBeUndefined();
        });
    });

    describe("dispose", () => {
        it("clears all observables", () => {
            const frameCallback = vi.fn();
            const sessionEndedCallback = vi.fn();
            const sessionInitCallback = vi.fn();
            const refSpaceCallback = vi.fn();

            sessionManager.onXRFrameObservable.add(frameCallback);
            sessionManager.onXRSessionEnded.add(sessionEndedCallback);
            sessionManager.onXRSessionInit.add(sessionInitCallback);
            sessionManager.onXRReferenceSpaceChanged.add(refSpaceCallback);

            sessionManager.dispose();

            expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(false);
            expect(sessionManager.onXRSessionEnded.hasObservers()).toBe(false);
            expect(sessionManager.onXRSessionInit.hasObservers()).toBe(false);
            expect(sessionManager.onXRReferenceSpaceChanged.hasObservers()).toBe(false);
        });

        it("clears onXRReady and onWorldScaleFactorChangedObservable", () => {
            sessionManager.onXRReady.add(vi.fn());
            sessionManager.onWorldScaleFactorChangedObservable.add(vi.fn());

            sessionManager.dispose();

            expect(sessionManager.onXRReady.hasObservers()).toBe(false);
            expect(sessionManager.onWorldScaleFactorChangedObservable.hasObservers()).toBe(false);
        });
    });

    describe("trySetViewportForView", () => {
        it("returns false when no base layer RTT provider is set", () => {
            const mockViewport = { x: 0, y: 0, width: 1, height: 1 } as any;
            const mockView = {} as XRView;

            expect(sessionManager.trySetViewportForView(mockViewport, mockView)).toBe(false);
        });
    });

    describe("getRenderTargetTextureForEye", () => {
        it("returns null when no base layer RTT provider is set", () => {
            expect(sessionManager.getRenderTargetTextureForEye("left" as XREye)).toBeNull();
        });
    });

    describe("getRenderTargetTextureForView", () => {
        it("returns null when no base layer RTT provider is set", () => {
            const mockView = {} as XRView;
            expect(sessionManager.getRenderTargetTextureForView(mockView)).toBeNull();
        });
    });

    describe("initializeAsync", () => {
        it("throws when navigator.xr is not available", async () => {
            // In jsdom, navigator.xr doesn't exist by default
            await expect(sessionManager.initializeAsync()).rejects.toThrow("WebXR not supported on this browser.");
        });
    });

    describe("onXRSessionEnded clears cameraToUseForPointers", () => {
        it("sets scene.cameraToUseForPointers to null when session ends", () => {
            // The constructor registers an observer on onXRSessionEnded
            scene.cameraToUseForPointers = {} as any;

            sessionManager.onXRSessionEnded.notifyObservers(null);

            expect(scene.cameraToUseForPointers).toBeNull();
        });
    });

    describe("scene disposal", () => {
        it("disposes sessionManager when scene is disposed", () => {
            const disposeSpy = vi.spyOn(sessionManager, "dispose");

            scene.dispose();

            expect(disposeSpy).toHaveBeenCalled();
        });
    });

    describe("_getGraphicsBinding", () => {
        it("throws when called before the XR session is initialized", () => {
            // No session has been entered, so the graphics binding cannot be created yet.
            expect(() => sessionManager._getGraphicsBinding()).toThrow(/before the XR session is initialized/);
        });

        it("throws when the engine has been disposed", () => {
            // Disposing the manager nulls out its engine reference.
            sessionManager.dispose();

            expect(() => sessionManager._getGraphicsBinding()).toThrow(/has been disposed/);
        });

        describe("binding selection", () => {
            const fakeSession = {} as XRSession;
            let originalWebGLBinding: unknown;
            let originalGPUBinding: unknown;

            beforeEach(() => {
                originalWebGLBinding = (globalThis as any).XRWebGLBinding;
                originalGPUBinding = (globalThis as any).XRGPUBinding;
                // jsdom has neither binding constructor; stub them so CreateFromEngine can run.
                (globalThis as any).XRWebGLBinding = vi.fn();
                (globalThis as any).XRGPUBinding = vi.fn();
                (sessionManager as any).session = fakeSession;
            });

            afterEach(() => {
                (globalThis as any).XRWebGLBinding = originalWebGLBinding;
                (globalThis as any).XRGPUBinding = originalGPUBinding;
            });

            it("returns a WebGL binding for a non-WebGPU engine", () => {
                (engine as any)._gl = {};
                expect(engine.isWebGPU).toBe(false);

                expect(sessionManager._getGraphicsBinding()).toBeInstanceOf(WebXRWebGLGraphicsBinding);
            });

            it("returns a WebGPU binding for a WebGPU engine", () => {
                (engine as any)._isWebGPU = true;
                (engine as any)._device = {};
                expect(engine.isWebGPU).toBe(true);

                expect(sessionManager._getGraphicsBinding()).toBeInstanceOf(WebXRWebGPUGraphicsBinding);
            });

            it("caches the binding across calls", () => {
                (engine as any)._gl = {};

                const first = sessionManager._getGraphicsBinding();
                const second = sessionManager._getGraphicsBinding();

                expect(second).toBe(first);
            });
        });
    });

    describe("initializeSessionAsync webgpu feature descriptor", () => {
        const fakeSession = { addEventListener: vi.fn() } as unknown as XRSession;
        let requestSession: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            requestSession = vi.fn().mockResolvedValue(fakeSession);
            (sessionManager as any)._xrNavigator = { xr: { requestSession } };
        });

        it("adds the 'webgpu' required feature for a WebGPU engine", async () => {
            (engine as any)._isWebGPU = true;

            await sessionManager.initializeSessionAsync("immersive-vr", {});

            expect(requestSession).toHaveBeenCalledWith("immersive-vr", expect.objectContaining({ requiredFeatures: ["webgpu"] }));
        });

        it("leaves the session init untouched for a non-WebGPU engine", async () => {
            const init: XRSessionInit = { requiredFeatures: ["local-floor"] };

            await sessionManager.initializeSessionAsync("immersive-vr", init);

            // WebGL path must be byte-for-byte identical: same object, no 'webgpu' injected.
            expect(requestSession.mock.calls[0][1]).toBe(init);
            expect(init.requiredFeatures).toEqual(["local-floor"]);
        });

        it("preserves existing required features and avoids duplicates for a WebGPU engine", async () => {
            (engine as any)._isWebGPU = true;

            await sessionManager.initializeSessionAsync("immersive-vr", { requiredFeatures: ["local-floor", "webgpu"] });

            expect(requestSession.mock.calls[0][1].requiredFeatures).toEqual(["local-floor", "webgpu"]);
        });
    });

    describe("updateRenderState", () => {
        it("does not throw when neither baseLayer nor layers is provided (WebGPU Phase 1 state)", () => {
            const updateRenderState = vi.fn();
            (sessionManager as any).session = { updateRenderState };

            expect(() => sessionManager.updateRenderState({ depthFar: 100, depthNear: 0.1 })).not.toThrow();
            expect(updateRenderState).toHaveBeenCalledTimes(1);
        });
    });

    describe("native session end cleanup", () => {
        let endHandler: (() => void) | undefined;
        let requestSession: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            endHandler = undefined;
            const fakeSession = {
                addEventListener: (type: string, cb: () => void) => {
                    if (type === "end") {
                        endHandler = cb;
                    }
                },
            } as unknown as XRSession;
            requestSession = vi.fn().mockResolvedValue(fakeSession);
            (sessionManager as any)._xrNavigator = { xr: { requestSession } };
        });

        // A WebGPU Phase 1 session stalls with no layer/no frame; ending it (e.g. the headset
        // system menu) must still clean up regardless of whether a frame ever arrived.
        it("cleans up when the session ends before any frame arrives (WebGPU no-frame path)", async () => {
            (engine as any)._isWebGPU = true;
            const endedObserver = vi.fn();
            sessionManager.onXRSessionEnded.add(endedObserver);

            await sessionManager.initializeSessionAsync("immersive-vr", {});
            expect(sessionManager.inXRSession).toBe(true);

            // Seed a graphics binding so we can assert it is released on end.
            (sessionManager as any)._graphicsBinding = {};
            expect(endHandler).toBeDefined();

            // Simulate the native "end" event (no XR frame was ever produced).
            expect(() => endHandler!()).not.toThrow();

            expect(sessionManager.inXRSession).toBe(false);
            expect(endedObserver).toHaveBeenCalledTimes(1);
            expect((sessionManager as any)._graphicsBinding).toBeNull();
        });
    });
});
