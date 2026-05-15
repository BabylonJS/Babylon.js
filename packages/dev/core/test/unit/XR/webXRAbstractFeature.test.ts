/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRAbstractFeature } from "core/XR/features/WebXRAbstractFeature";
import { type IWebXRFeature } from "core/XR/webXRFeaturesManager";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

/**
 * Concrete implementation of the abstract feature for testing.
 */
class TestFeature extends WebXRAbstractFeature {
    public onXRFrameCalled = false;
    public lastFrame: XRFrame | null = null;

    constructor(sessionManager: WebXRSessionManager) {
        super(sessionManager);
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        this.onXRFrameCalled = true;
        this.lastFrame = _xrFrame;
    }
}

describe("WebXRAbstractFeature", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let feature: TestFeature;

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
        feature = new TestFeature(sessionManager);
    });

    afterEach(() => {
        if (!feature.isDisposed) {
            feature.dispose();
        }
        scene.dispose();
        engine.dispose();
    });

    describe("initial state", () => {
        it("is not attached by default", () => {
            expect(feature.attached).toBe(false);
        });

        it("is not disposed by default", () => {
            expect(feature.isDisposed).toBe(false);
        });

        it("has disableAutoAttach set to false by default", () => {
            expect(feature.disableAutoAttach).toBe(false);
        });

        it("has empty xrNativeFeatureName by default", () => {
            expect(feature.xrNativeFeatureName).toBe("");
        });
    });

    describe("isCompatible", () => {
        it("returns true by default", () => {
            expect(feature.isCompatible()).toBe(true);
        });
    });

    describe("attach", () => {
        it("sets attached to true", () => {
            const result = feature.attach();
            expect(result).toBe(true);
            expect(feature.attached).toBe(true);
        });

        it("returns false when already attached (without force)", () => {
            feature.attach();
            const result = feature.attach();
            expect(result).toBe(false);
        });

        it("re-attaches when force is true", () => {
            feature.attach();
            const result = feature.attach(true);
            expect(result).toBe(true);
            expect(feature.attached).toBe(true);
        });

        it("returns false when feature is disposed", () => {
            feature.dispose();
            const result = feature.attach();
            expect(result).toBe(false);
            expect(feature.attached).toBe(false);
        });

        it("notifies onFeatureAttachObservable", () => {
            const callback = vi.fn();
            feature.onFeatureAttachObservable.add(callback);

            feature.attach();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(feature, expect.anything());
        });

        it("registers frame observer on attach", () => {
            feature.attach();

            // Simulate a frame by notifying the observable
            const mockFrame = {} as XRFrame;
            sessionManager.onXRFrameObservable.notifyObservers(mockFrame);

            expect(feature.onXRFrameCalled).toBe(true);
            expect(feature.lastFrame).toBe(mockFrame);
        });
    });

    describe("detach", () => {
        it("returns false when not attached and sets disableAutoAttach", () => {
            const result = feature.detach();
            expect(result).toBe(false);
            expect(feature.disableAutoAttach).toBe(true);
        });

        it("detaches when attached", () => {
            feature.attach();
            const result = feature.detach();
            expect(result).toBe(true);
            expect(feature.attached).toBe(false);
        });

        it("notifies onFeatureDetachObservable", () => {
            feature.attach();

            const callback = vi.fn();
            feature.onFeatureDetachObservable.add(callback);

            feature.detach();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(feature, expect.anything());
        });

        it("removes frame observer on detach", () => {
            feature.attach();
            feature.detach();

            // Simulate a frame - should NOT trigger the feature's handler
            feature.onXRFrameCalled = false;
            const mockFrame = {} as XRFrame;
            sessionManager.onXRFrameObservable.notifyObservers(mockFrame);

            expect(feature.onXRFrameCalled).toBe(false);
        });
    });

    describe("dispose", () => {
        it("detaches and marks as disposed", () => {
            feature.attach();
            feature.dispose();

            expect(feature.attached).toBe(false);
            expect(feature.isDisposed).toBe(true);
        });

        it("clears observables", () => {
            feature.onFeatureAttachObservable.add(vi.fn());
            feature.onFeatureDetachObservable.add(vi.fn());

            feature.dispose();

            expect(feature.onFeatureAttachObservable.hasObservers()).toBe(false);
            expect(feature.onFeatureDetachObservable.hasObservers()).toBe(false);
        });

        it("prevents re-attach after dispose", () => {
            feature.dispose();

            const result = feature.attach();
            expect(result).toBe(false);
            expect(feature.attached).toBe(false);
        });
    });

    describe("xrNativeFeatureName", () => {
        it("can be set and retrieved", async () => {
            // The setter accesses sessionManager.isNative which requires _xrNavigator.
            // Mock navigator.xr and initialize the session manager so _xrNavigator is set.
            const originalXr = (navigator as any).xr;
            (navigator as any).xr = { isSessionSupported: vi.fn() };
            try {
                await sessionManager.initializeAsync();
                feature.xrNativeFeatureName = "hit-test";
                expect(feature.xrNativeFeatureName).toBe("hit-test");
            } finally {
                if (originalXr === undefined) {
                    delete (navigator as any).xr;
                } else {
                    (navigator as any).xr = originalXr;
                }
            }
        });
    });

    describe("_addNewAttachObserver behavior", () => {
        it("observers added via attach are automatically removed on detach", () => {
            feature.attach();

            // The frame observer was added during attach
            expect(sessionManager.onXRFrameObservable.hasObservers()).toBe(true);

            feature.detach();

            // After detach, the frame observer should have been removed
            // (only the feature's observer - the session manager might have its own)
            feature.onXRFrameCalled = false;
            sessionManager.onXRFrameObservable.notifyObservers({} as XRFrame);
            expect(feature.onXRFrameCalled).toBe(false);
        });

        it("multiple attach/detach cycles work correctly", () => {
            // First cycle
            feature.attach();
            const mockFrame1 = {} as XRFrame;
            sessionManager.onXRFrameObservable.notifyObservers(mockFrame1);
            expect(feature.onXRFrameCalled).toBe(true);

            feature.detach();
            feature.onXRFrameCalled = false;
            sessionManager.onXRFrameObservable.notifyObservers(mockFrame1);
            expect(feature.onXRFrameCalled).toBe(false);

            // Second cycle
            feature.attach();
            feature.onXRFrameCalled = false;
            const mockFrame2 = {} as XRFrame;
            sessionManager.onXRFrameObservable.notifyObservers(mockFrame2);
            expect(feature.onXRFrameCalled).toBe(true);
            expect(feature.lastFrame).toBe(mockFrame2);
        });
    });
});
