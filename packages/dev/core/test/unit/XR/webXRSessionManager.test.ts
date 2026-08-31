/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import {
    WebGPUXREngineNotCompatibleErrorMessage,
    WebGPUXRNotSupportedErrorMessage,
    WebGPUXRSessionNotSupportedErrorMessage,
    WebXRGraphicsBindingType,
    WebXRWebGLGraphicsBinding,
    WebXRWebGPUGraphicsBinding,
} from "core/XR/webXRGraphicsBinding";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

describe("WebXRSessionManager", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let originalGPUSubImage: unknown;

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
        originalGPUSubImage = (globalThis as any).XRGPUSubImage;
        const subImage = vi.fn();
        subImage.prototype.getViewDescriptor = vi.fn();
        (globalThis as any).XRGPUSubImage = subImage;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        (globalThis as any).XRGPUSubImage = originalGPUSubImage;
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
                const nativeBinding = {};
                (globalThis as any).XRWebGLBinding.mockImplementation(function () {
                    return nativeBinding;
                });
                (engine as any)._gl = {};
                expect(engine.isWebGPU).toBe(false);

                const binding = sessionManager._getGraphicsBinding();
                expect(binding).toBeInstanceOf(WebXRWebGLGraphicsBinding);
                expect(binding.bindingType).toBe(WebXRGraphicsBindingType.WebGL);
                expect(binding.binding).toBe(nativeBinding);
            });

            it("returns a WebGPU binding for a WebGPU engine", () => {
                const nativeBinding = {};
                (globalThis as any).XRGPUBinding.mockImplementation(function () {
                    return nativeBinding;
                });
                (engine as any)._isWebGPU = true;
                (engine as any)._device = {};
                expect(engine.isWebGPU).toBe(true);

                const binding = sessionManager._getGraphicsBinding();
                expect(binding).toBeInstanceOf(WebXRWebGPUGraphicsBinding);
                expect(binding.bindingType).toBe(WebXRGraphicsBindingType.WebGPU);
                expect(binding.binding).toBe(nativeBinding);
            });

            it("caches the binding across calls", () => {
                (engine as any)._gl = {};

                const first = sessionManager._getGraphicsBinding();
                const second = sessionManager._getGraphicsBinding();

                expect(second).toBe(first);
                expect((globalThis as any).XRWebGLBinding).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("IsWebGPUXRSupported", () => {
        let originalGPUBinding: unknown;

        beforeEach(() => {
            originalGPUBinding = (globalThis as any).XRGPUBinding;
        });

        afterEach(() => {
            (globalThis as any).XRGPUBinding = originalGPUBinding;
        });

        function installCompatibleBinding(): void {
            const binding = vi.fn();
            binding.prototype.createProjectionLayer = vi.fn();
            binding.prototype.getViewSubImage = vi.fn();
            binding.prototype.getPreferredColorFormat = vi.fn();
            (globalThis as any).XRGPUBinding = binding;
        }

        it("returns false when XRGPUBinding is unavailable", () => {
            delete (globalThis as any).XRGPUBinding;

            expect(WebXRSessionManager.IsWebGPUXRSupported).toBe(false);
        });

        it("returns false when XRGPUBinding is not a constructor", () => {
            (globalThis as any).XRGPUBinding = {};

            expect(WebXRSessionManager.IsWebGPUXRSupported).toBe(false);
        });

        it("returns false when XRGPUSubImage is unavailable", () => {
            installCompatibleBinding();
            delete (globalThis as any).XRGPUSubImage;

            expect(WebXRSessionManager.IsWebGPUXRSupported).toBe(false);
        });

        it("returns false when XRGPUSubImage.getViewDescriptor is unavailable", () => {
            installCompatibleBinding();
            delete (globalThis as any).XRGPUSubImage.prototype.getViewDescriptor;

            expect(WebXRSessionManager.IsWebGPUXRSupported).toBe(false);
        });

        it.each(["createProjectionLayer", "getViewSubImage", "getPreferredColorFormat"])("returns false when XRGPUBinding.%s is unavailable", (methodName) => {
            installCompatibleBinding();
            delete (globalThis as any).XRGPUBinding.prototype[methodName];

            expect(WebXRSessionManager.IsWebGPUXRSupported).toBe(false);
        });

        it("returns true when the required projection APIs are exposed", () => {
            installCompatibleBinding();

            expect(WebXRSessionManager.IsWebGPUXRSupported).toBe(true);
        });
    });

    describe("initializeSessionAsync webgpu feature descriptor", () => {
        const fakeSession = { addEventListener: vi.fn() } as unknown as XRSession;
        let requestSession: ReturnType<typeof vi.fn>;
        let originalGPUBinding: unknown;

        beforeEach(() => {
            originalGPUBinding = (globalThis as any).XRGPUBinding;
            const binding = vi.fn();
            binding.prototype.createProjectionLayer = vi.fn();
            binding.prototype.getViewSubImage = vi.fn();
            binding.prototype.getPreferredColorFormat = vi.fn();
            (globalThis as any).XRGPUBinding = binding;
            requestSession = vi.fn().mockResolvedValue(fakeSession);
            (sessionManager as any)._xrNavigator = { xr: { requestSession } };
            (engine as any)._options = { xrCompatible: true };
        });

        afterEach(() => {
            (globalThis as any).XRGPUBinding = originalGPUBinding;
        });

        it("rejects an unsupported WebGPU runtime before requesting a session", async () => {
            delete (globalThis as any).XRGPUBinding;
            (engine as any)._isWebGPU = true;

            await expect(sessionManager.initializeSessionAsync("immersive-vr", {})).rejects.toThrow(WebGPUXRNotSupportedErrorMessage);

            expect(requestSession).not.toHaveBeenCalled();
            expect(sessionManager.inXRSession).toBe(false);
        });

        it("rejects a WebGPU engine created without XR compatibility before requesting a session", async () => {
            (engine as any)._isWebGPU = true;
            (engine as any)._options.xrCompatible = false;

            await expect(sessionManager.initializeSessionAsync("immersive-vr", {})).rejects.toThrow(WebGPUXREngineNotCompatibleErrorMessage);

            expect(requestSession).not.toHaveBeenCalled();
            expect(sessionManager.inXRSession).toBe(false);
        });

        it("wraps a WebGPU session NotSupportedError with actionable fallback guidance", async () => {
            const notSupportedError = new DOMException("webgpu feature rejected", "NotSupportedError");
            requestSession.mockRejectedValue(notSupportedError);
            (engine as any)._isWebGPU = true;

            await expect(sessionManager.initializeSessionAsync("immersive-vr", {})).rejects.toMatchObject({
                message: WebGPUXRSessionNotSupportedErrorMessage,
                cause: notSupportedError,
            });
        });

        it("wraps a cross-realm-shaped WebGPU session NotSupportedError", async () => {
            const notSupportedError = { name: "NotSupportedError", message: "webgpu feature rejected" };
            requestSession.mockRejectedValue(notSupportedError);
            (engine as any)._isWebGPU = true;

            await expect(sessionManager.initializeSessionAsync("immersive-vr", {})).rejects.toMatchObject({
                message: WebGPUXRSessionNotSupportedErrorMessage,
                cause: notSupportedError,
            });
        });

        it("preserves unrelated WebGPU session errors", async () => {
            const securityError = new DOMException("user gesture required", "SecurityError");
            requestSession.mockRejectedValue(securityError);
            (engine as any)._isWebGPU = true;

            await expect(sessionManager.initializeSessionAsync("immersive-vr", {})).rejects.toBe(securityError);
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

        it("ends and cleans up a negotiated session when graphics-binding initialization fails", async () => {
            const bindingError = new Error("XRGPUBinding rejected the device");
            class FailingXRGPUBinding {
                constructor() {
                    throw bindingError;
                }

                public createProjectionLayer() {}

                public getViewSubImage() {}

                public getPreferredColorFormat() {}
            }
            (globalThis as any).XRGPUBinding = FailingXRGPUBinding;
            const end = vi.fn().mockResolvedValue(undefined);
            const endedObserver = vi.fn(() => {
                expect(end).toHaveBeenCalledTimes(1);
            });
            requestSession.mockResolvedValue({
                addEventListener: vi.fn(),
                end,
            } as unknown as XRSession);
            (engine as any)._isWebGPU = true;
            (engine as any)._device = {};
            sessionManager.onXRSessionEnded.add(endedObserver);
            sessionManager.onXRSessionInit.add(() => (sessionManager as any)._getGraphicsBinding());

            await expect(sessionManager.initializeSessionAsync("immersive-vr", {})).rejects.toBe(bindingError);

            expect(end).toHaveBeenCalledTimes(1);
            expect(endedObserver).toHaveBeenCalledTimes(1);
            expect(sessionManager.inXRSession).toBe(false);
            expect((sessionManager as any)._graphicsBinding).toBeNull();
        });
    });

    describe("updateRenderState", () => {
        it("does not throw when neither baseLayer nor layers is provided", () => {
            const updateRenderState = vi.fn();
            (sessionManager as any).session = { updateRenderState };

            expect(() => sessionManager.updateRenderState({ depthFar: 100, depthNear: 0.1 })).not.toThrow();
            expect(updateRenderState).toHaveBeenCalledTimes(1);
        });
    });

    describe("native session end cleanup", () => {
        let endHandler: (() => void) | undefined;
        let end: ReturnType<typeof vi.fn>;
        let requestSession: ReturnType<typeof vi.fn>;
        let originalGPUBinding: unknown;

        beforeEach(() => {
            originalGPUBinding = (globalThis as any).XRGPUBinding;
            const binding = vi.fn();
            binding.prototype.createProjectionLayer = vi.fn();
            binding.prototype.getViewSubImage = vi.fn();
            binding.prototype.getPreferredColorFormat = vi.fn();
            (globalThis as any).XRGPUBinding = binding;
            endHandler = undefined;
            end = vi.fn().mockResolvedValue(undefined);
            const fakeSession = {
                addEventListener: (type: string, cb: () => void) => {
                    if (type === "end") {
                        endHandler = cb;
                    }
                },
                end,
            } as unknown as XRSession;
            requestSession = vi.fn().mockResolvedValue(fakeSession);
            (sessionManager as any)._xrNavigator = { xr: { requestSession } };
            (engine as any)._options = { xrCompatible: true };
        });

        afterEach(() => {
            (globalThis as any).XRGPUBinding = originalGPUBinding;
        });

        it("cleans up when the session ends before any frame arrives", async () => {
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

        it("cleans up when ending the session rejects", async () => {
            end.mockRejectedValue(new Error("end failed"));
            const endedObserver = vi.fn();
            sessionManager.onXRSessionEnded.add(endedObserver);

            await sessionManager.initializeSessionAsync("immersive-vr", {});
            (sessionManager as any)._graphicsBinding = {};

            await expect(sessionManager.exitXRAsync()).resolves.toBeUndefined();

            expect(end).toHaveBeenCalledTimes(1);
            expect(sessionManager.inXRSession).toBe(false);
            expect(endedObserver).toHaveBeenCalledTimes(1);
            expect((sessionManager as any)._graphicsBinding).toBeNull();
        });

        it("restores engine state and releases bindings when an end observer throws", async () => {
            const observerError = new Error("observer failed");
            const restoreDefaultFramebuffer = vi.spyOn(engine, "restoreDefaultFramebuffer");
            sessionManager.onXRSessionEnded.add(() => {
                throw observerError;
            });

            await sessionManager.initializeSessionAsync("immersive-vr", {});
            (sessionManager as any)._graphicsBinding = {};

            expect(() => endHandler!()).toThrow(observerError);
            expect(restoreDefaultFramebuffer).toHaveBeenCalledTimes(1);
            expect(sessionManager.inXRSession).toBe(false);
            expect((sessionManager as any)._graphicsBinding).toBeNull();
        });
    });
});
