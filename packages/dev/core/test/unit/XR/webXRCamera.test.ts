/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRCamera } from "core/XR/webXRCamera";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { Vector3, Quaternion } from "core/Maths/math.vector";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Camera } from "core/Cameras/camera";
import { beforeEach, afterEach, describe, it, expect } from "vitest";

describe("WebXRCamera", () => {
    let engine: NullEngine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let xrCamera: WebXRCamera;

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
        xrCamera = new WebXRCamera("testXRCamera", scene, sessionManager);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("construction", () => {
        it("creates a camera with the given name", () => {
            expect(xrCamera.name).toBe("testXRCamera");
        });

        it("is a FreeCamera", () => {
            expect(xrCamera).toBeInstanceOf(FreeCamera);
        });

        it("has a rotationQuaternion", () => {
            expect(xrCamera.rotationQuaternion).toBeDefined();
            expect(xrCamera.rotationQuaternion).toBeInstanceOf(Quaternion);
        });

        it("starts at the origin", () => {
            expect(xrCamera.position.x).toBe(0);
            expect(xrCamera.position.y).toBe(0);
            expect(xrCamera.position.z).toBe(0);
        });

        it("has minZ set to 0.1", () => {
            expect(xrCamera.minZ).toBeCloseTo(0.1);
        });

        it("has custom rig mode", () => {
            expect(xrCamera.cameraRigMode).toBe(Camera.RIG_MODE_CUSTOM);
        });

        it("has updateUpVectorFromRotation enabled", () => {
            expect(xrCamera.updateUpVectorFromRotation).toBe(true);
        });

        it("has compensateOnFirstFrame enabled by default", () => {
            expect(xrCamera.compensateOnFirstFrame).toBe(true);
        });
    });

    describe("getClassName", () => {
        it("returns 'WebXRCamera'", () => {
            expect(xrCamera.getClassName()).toBe("WebXRCamera");
        });
    });

    describe("observables", () => {
        it("has onXRCameraInitializedObservable", () => {
            expect(xrCamera.onXRCameraInitializedObservable).toBeDefined();
        });

        it("has onBeforeCameraTeleport", () => {
            expect(xrCamera.onBeforeCameraTeleport).toBeDefined();
        });

        it("has onAfterCameraTeleport", () => {
            expect(xrCamera.onAfterCameraTeleport).toBeDefined();
        });

        it("has onTrackingStateChanged", () => {
            expect(xrCamera.onTrackingStateChanged).toBeDefined();
        });
    });

    describe("trackingState", () => {
        it("starts with NOT_TRACKING state", () => {
            // WebXRTrackingState.NOT_TRACKING = 0
            expect(xrCamera.trackingState).toBe(0);
        });
    });

    describe("realWorldHeight", () => {
        it("returns 0 when no XR frame is available", () => {
            expect(xrCamera.realWorldHeight).toBe(0);
        });
    });

    describe("setTransformationFromNonVRCamera", () => {
        it("copies rotation from another camera (Y-axis only)", () => {
            const otherCamera = new FreeCamera("other", new Vector3(5, 3, 10), scene);
            otherCamera.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI / 4, 0);

            xrCamera.setTransformationFromNonVRCamera(otherCamera);

            // Y position is reset to 0
            expect(xrCamera.position.y).toBe(0);
        });

        it("does nothing when called with the same camera", () => {
            const initialPos = xrCamera.position.clone();
            xrCamera.setTransformationFromNonVRCamera(xrCamera);
            expect(xrCamera.position.x).toBe(initialPos.x);
            expect(xrCamera.position.y).toBe(initialPos.y);
            expect(xrCamera.position.z).toBe(initialPos.z);
        });
    });

    describe("rigCameras", () => {
        it("starts with at least one rig camera", () => {
            expect(xrCamera.rigCameras.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("_updateForDualEyeDebugging", () => {
        it("sets up two rig cameras with split viewports", () => {
            xrCamera._updateForDualEyeDebugging();

            expect(xrCamera.rigCameras.length).toBe(2);
            // Left eye: 0-50%
            expect(xrCamera.rigCameras[0].viewport.x).toBe(0);
            expect(xrCamera.rigCameras[0].viewport.width).toBe(0.5);
            // Right eye: 50-100%
            expect(xrCamera.rigCameras[1].viewport.x).toBe(0.5);
            expect(xrCamera.rigCameras[1].viewport.width).toBe(0.5);
        });

        it("clears output render targets for debug rig cameras", () => {
            xrCamera._updateForDualEyeDebugging();

            expect(xrCamera.rigCameras[0].outputRenderTarget).toBeNull();
            expect(xrCamera.rigCameras[1].outputRenderTarget).toBeNull();
        });
    });
});
