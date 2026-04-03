/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
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
});
