/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRCamera } from "core/XR/webXRCamera";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { Vector3, Quaternion, Matrix } from "core/Maths/math.vector";
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

    describe("projection depth-range (WebGPU half-Z) handling", () => {
        // Builds a synthetic right-handed XR projection matrix (as an XR binding would provide it) in the requested
        // NDC depth convention. halfZRange === false => WebGL/OpenGL [-1, 1]; true => WebGPU/D3D [0, 1].
        function buildXRProjection(halfZRange: boolean, near = 0.1, far = 1000): Float32Array {
            const m = new Matrix();
            Matrix.PerspectiveFovRHToRef(Math.PI / 2, 1, near, far, m, true, halfZRange);
            return Float32Array.from(m.asArray());
        }

        // Drives one XR view update with the given raw binding projection matrix and returns the resulting frozen
        // rig-camera projection matrix. Tests set scene.useRightHandedSystem to control whether the LH hand-toggle runs.
        function driveViewUpdate(projectionMatrix: Float32Array): Matrix {
            const pose = {
                emulatedPosition: false,
                transform: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
                views: [
                    {
                        eye: "left",
                        transform: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
                        projectionMatrix,
                    },
                ],
            };
            sessionManager.currentFrame = { getViewerPose: () => pose } as any;
            // There is no real XR session in unit tests, so seed the near/far cache to skip the updateRenderState path.
            (xrCamera as any)._cache.minZ = xrCamera.minZ;
            (xrCamera as any)._cache.maxZ = xrCamera.maxZ;
            (xrCamera as any)._updateFromXRSession();
            return (xrCamera.rigCameras[0] as any)._projectionMatrix as Matrix;
        }

        // NDC z of the right-handed view-space point (0, 0, z) after the perspective divide.
        function ndcZ(matrix: Matrix, z: number): number {
            return Vector3.TransformCoordinatesFromFloatsToRef(0, 0, z, matrix, new Vector3()).z;
        }

        it("converts a [-1, 1] XR projection to [0, 1] on a half-Z (WebGPU) engine", () => {
            scene.useRightHandedSystem = true; // isolate the depth-range conversion from the LH hand-toggle
            (engine as any).isNDCHalfZRange = true;

            const result = driveViewUpdate(buildXRProjection(false, 0.1, 1000));

            expect(ndcZ(result, -0.1)).toBeCloseTo(0, 4); // near plane -> 0
            expect(ndcZ(result, -1000)).toBeCloseTo(1, 4); // far plane -> 1
        });

        it("leaves an already [0, 1] XR projection unchanged on a half-Z engine (no double conversion)", () => {
            scene.useRightHandedSystem = true;
            (engine as any).isNDCHalfZRange = true;

            const raw = buildXRProjection(true, 0.1, 1000);
            const result = driveViewUpdate(raw);

            // Still maps near -> 0 / far -> 1 (would be ~0.25 / ~1 if double-converted).
            expect(ndcZ(result, -0.1)).toBeCloseTo(0, 4);
            expect(ndcZ(result, -1000)).toBeCloseTo(1, 4);
            // And it is numerically the raw matrix (conversion skipped entirely).
            const rawMatrix = Matrix.FromArray(raw);
            for (let k = 0; k < 16; k++) {
                expect(result.m[k]).toBeCloseTo(rawMatrix.m[k], 6);
            }
        });

        it("never touches the projection on a non-half-Z (WebGL2) engine - byte identical", () => {
            // NullEngine defaults isNDCHalfZRange to false; assert explicitly for clarity.
            (engine as any).isNDCHalfZRange = false;

            const raw = buildXRProjection(false, 0.1, 1000); // WebGL [-1, 1] convention
            const result = driveViewUpdate(raw); // default LH scene => hand-toggle applies

            // Expected = verbatim load + hand-toggle, with NO range conversion (the WebGPU block is skipped).
            const expected = Matrix.FromArray(raw);
            expected.toggleProjectionMatrixHandInPlace();
            for (let k = 0; k < 16; k++) {
                expect(result.m[k]).toBe(expected.m[k]); // exact / byte-identical
            }
        });

        it("converts an asymmetric (off-center) [-1, 1] XR projection - real XR eye frusta", () => {
            scene.useRightHandedSystem = true;
            (engine as any).isNDCHalfZRange = true;

            // Start from a symmetric [-1, 1] projection and introduce off-center x/y projection-plane offsets
            // (m[8], m[9]) to mimic a real, asymmetric XR eye frustum. These do not affect the depth mapping.
            const raw = buildXRProjection(false, 0.1, 1000);
            raw[8] = 0.2;
            raw[9] = -0.15;
            const result = driveViewUpdate(raw);

            // Depth still maps to [0, 1] despite the asymmetry...
            expect(ndcZ(result, -0.1)).toBeCloseTo(0, 4);
            expect(ndcZ(result, -1000)).toBeCloseTo(1, 4);
            // ...and the asymmetry (x/y offset columns) is preserved by the conversion (it only remaps the z column).
            expect(result.m[8]).toBeCloseTo(0.2, 6);
            expect(result.m[9]).toBeCloseTo(-0.15, 6);
        });

        it("guards depthNear <= 0: defaults to converting without producing NaN", () => {
            scene.useRightHandedSystem = true;
            (engine as any).isNDCHalfZRange = true;
            xrCamera.minZ = 0; // near-plane probe would divide by zero -> guard path

            const raw = buildXRProjection(false, 0.1, 1000);
            const result = driveViewUpdate(raw);

            for (let k = 0; k < 16; k++) {
                expect(Number.isNaN(result.m[k])).toBe(false);
            }
            // Guard forces conversion; result equals the raw matrix with the half-Z conversion applied.
            const expected = Matrix.FromArray(raw).convertProjectionToHalfZRangeInPlace();
            for (let k = 0; k < 16; k++) {
                expect(result.m[k]).toBeCloseTo(expected.m[k], 6);
            }
        });

        it("convertProjectionToHalfZRangeInPlace matches the engine's own half-Z builder", () => {
            // The @internal converter must reproduce exactly what PerspectiveFovRHToRef bakes in when halfZRange is set.
            const converted = new Matrix();
            Matrix.PerspectiveFovRHToRef(1.2, 1.5, 0.2, 500, converted, true, false); // [-1, 1]
            converted.convertProjectionToHalfZRangeInPlace();

            const reference = new Matrix();
            Matrix.PerspectiveFovRHToRef(1.2, 1.5, 0.2, 500, reference, true, true); // [0, 1]

            for (let k = 0; k < 16; k++) {
                expect(converted.m[k]).toBeCloseTo(reference.m[k], 6);
            }
        });
    });
});
