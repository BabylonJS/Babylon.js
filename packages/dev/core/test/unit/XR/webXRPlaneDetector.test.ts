/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { WebXRPlaneDetector } from "core/XR/features/WebXRPlaneDetector";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("WebXRPlaneDetector", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;

    const setActiveSession = (initiateRoomCapture?: () => Promise<void>) => {
        const session = {
            enabledFeatures: ["plane-detection"],
            initiateRoomCapture,
        } as XRSession;
        sessionManager.session = session;
        sessionManager.inXRSession = true;
        sessionManager.referenceSpace = {} as XRReferenceSpace;
        return session;
    };

    beforeEach(async () => {
        Object.defineProperty(navigator, "xr", {
            configurable: true,
            value: { native: false },
        });
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        sessionManager = new WebXRSessionManager(scene);
        await sessionManager.initializeAsync();
    });

    afterEach(() => {
        sessionManager.inXRSession = false;
        scene.dispose();
        engine.dispose();
    });

    it("delegates room capture and follows native promise settlement", async () => {
        let resolveNativePromise = () => {};
        const nativePromise = new Promise<void>((resolve) => {
            resolveNativePromise = resolve;
        });
        const initiateRoomCapture = vi.fn(() => nativePromise);
        const session = setActiveSession(initiateRoomCapture);
        const feature = new WebXRPlaneDetector(sessionManager);
        let settled = false;

        const result = feature.initiateRoomCapture();
        void result.then(() => {
            settled = true;
        });

        expect(initiateRoomCapture).toHaveBeenCalledExactlyOnceWith();
        expect(initiateRoomCapture.mock.instances[0]).toBe(session);
        await Promise.resolve();
        expect(settled).toBe(false);

        resolveNativePromise();
        await result;
        expect(settled).toBe(true);
    });

    it("propagates native room capture rejections", async () => {
        const nativeError = new Error("Room capture failed");
        const nativePromise = Promise.reject(nativeError);
        setActiveSession(() => nativePromise);
        const feature = new WebXRPlaneDetector(sessionManager);

        const result = feature.initiateRoomCapture();

        await expect(result).rejects.toBe(nativeError);
    });

    it("rejects when the active session does not support room capture", async () => {
        setActiveSession();
        const feature = new WebXRPlaneDetector(sessionManager);

        await expect(feature.initiateRoomCapture()).rejects.toThrow("XRSession.initiateRoomCapture is not supported by this XR runtime.");
    });

    it("rejects when there is no active XR session", async () => {
        const feature = new WebXRPlaneDetector(sessionManager);

        await expect(feature.initiateRoomCapture()).rejects.toThrow("WebXR room capture requires an active XR session.");
    });

    it("continues reporting detected planes after room capture", async () => {
        setActiveSession(() => Promise.resolve());
        const feature = new WebXRPlaneDetector(sessionManager);
        const onPlaneAdded = vi.fn();
        feature.onPlaneAddedObservable.add(onPlaneAdded);
        const xrPlane = {
            lastChangedTime: 0,
            planeSpace: {},
            polygon: [{ x: 1, y: 2, z: 3 }],
        };
        const xrFrame = {
            detectedPlanes: new Set([xrPlane]),
            getPose: vi.fn(() => ({
                transform: {
                    matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                },
            })),
        } as unknown as XRFrame;

        expect(feature.attach()).toBe(true);
        await feature.initiateRoomCapture();
        sessionManager.onXRFrameObservable.notifyObservers(xrFrame);

        expect(onPlaneAdded).toHaveBeenCalledTimes(1);
        expect(onPlaneAdded.mock.calls[0][0].xrPlane).toBe(xrPlane);
        expect(onPlaneAdded.mock.calls[0][0].polygonDefinition[0].asArray()).toEqual([1, 2, -3]);
    });
});
