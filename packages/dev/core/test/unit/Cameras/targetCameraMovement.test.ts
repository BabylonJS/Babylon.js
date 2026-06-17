import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { TargetCamera } from "core/Cameras/targetCamera";
import { TargetCameraMovement } from "core/Cameras/targetCameraMovement";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type Nullable } from "core/types";

describe("TargetCameraMovement", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: FreeCamera;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        camera = new FreeCamera("test", new Vector3(0, 0, 0), scene);
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    describe("always-on movement", () => {
        it("movement is defined on construction without any opt-in", () => {
            expect(camera.movement).toBeDefined();
            expect(camera.movement).toBeInstanceOf(TargetCameraMovement);
        });

        it("base TargetCamera also gets a TargetCameraMovement", () => {
            const target = new TargetCamera("target", new Vector3(0, 0, 0), scene!);
            expect(target.movement).toBeInstanceOf(TargetCameraMovement);
        });
    });

    describe("default inputMap", () => {
        it("maps pointer drag to rotate", () => {
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
            expect(camera.movement.input.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("rotate");
        });

        it("has no separate zoom interaction (wheel folds into translate/rotate)", () => {
            expect(camera.movement.input.handlers).not.toHaveProperty("zoom");
        });
    });

    describe("default handlers", () => {
        it("translate accumulates into panAccumulatedPixels (world space)", () => {
            camera.movement.input.handlers.translate(1, 2, 3);
            expect(camera.movement.panAccumulatedPixels.x).toBe(1);
            expect(camera.movement.panAccumulatedPixels.y).toBe(2);
            expect(camera.movement.panAccumulatedPixels.z).toBe(3);
        });

        it("rotate accumulates into rotationAccumulatedPixels (x=pitch, y=yaw)", () => {
            camera.movement.input.handlers.rotate(0.3, 0.7);
            expect(camera.movement.rotationAccumulatedPixels.x).toBe(0.3);
            expect(camera.movement.rotationAccumulatedPixels.y).toBe(0.7);
        });

        it("accumulates across multiple calls", () => {
            camera.movement.input.handlers.rotate(0.1, 0.2);
            camera.movement.input.handlers.rotate(0.1, 0.2);
            expect(camera.movement.rotationAccumulatedPixels.x).toBeCloseTo(0.2);
            expect(camera.movement.rotationAccumulatedPixels.y).toBeCloseTo(0.4);
        });
    });

    describe("_checkInputs reference-framerate behavior", () => {
        it("applies a single-frame rotation equal to the legacy cameraRotation value", () => {
            // At the reference framerate the per-frame applied delta equals the raw input,
            // matching the legacy apply-then-decay behavior on the first frame.
            camera.cameraRotation.x = 0.1;
            camera.cameraRotation.y = 0.2;
            camera._checkInputs();

            expect(camera.rotation.x).toBeCloseTo(0.1, 5);
            expect(camera.rotation.y).toBeCloseTo(0.2, 5);
        });

        it("resets cameraRotation after consuming it so it is not re-applied", () => {
            camera.cameraRotation.x = 0.1;
            camera.cameraRotation.y = 0.2;
            camera._checkInputs();

            expect(camera.cameraRotation.x).toBe(0);
            expect(camera.cameraRotation.y).toBe(0);
        });

        it("applies a single-frame translation equal to the legacy cameraDirection value", () => {
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.copyFromFloats(0, 0, 1);
            camera._checkInputs();

            expect(camera.position.z).toBeCloseTo(1, 5);
            expect(camera.cameraDirection.x).toBe(0);
            expect(camera.cameraDirection.y).toBe(0);
            expect(camera.cameraDirection.z).toBe(0);
        });

        it("continues to rotate via inertial glide after input stops", () => {
            camera.inertia = 0.9;
            camera.cameraRotation.x = 0.1;
            camera._checkInputs();
            const afterFirst = camera.rotation.x;

            // No new input — glide should still advance the rotation (decayed).
            camera._checkInputs();
            const afterSecond = camera.rotation.x;

            expect(afterSecond).toBeGreaterThan(afterFirst);
            // Decayed step should be smaller than the initial step.
            expect(afterSecond - afterFirst).toBeLessThan(afterFirst);
        });
    });

    describe("FreeCameraMouseInput respects the configurable input map", () => {
        it("does not rotate when the pointer interaction is unmapped", () => {
            camera.movement.input.inputMap = [];
            // resolveInteraction now returns null, so the mouse input must not write rotation.
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0 })).toBeNull();
        });
    });

    describe("inertia accessor convergence", () => {
        it("seeds the movement system's pan/rotation inertia from the camera default on construction", () => {
            // Default Camera.inertia is 0.9; the constructor pushes it into the movement system.
            expect(camera.inertia).toBe(0.9);
            expect(camera.movement.panInertia).toBe(0.9);
            expect(camera.movement.rotationInertia).toBe(0.9);
        });

        it("produces finite, advancing rotation during a default-inertia glide (no NaN)", () => {
            // Regression: a fresh camera must glide on its default inertia (0.9). If the inertia
            // accessor ever yields undefined, the movement decay becomes NaN and the camera freezes.
            // (The shipped UMD bundle previously mis-compiled `super.inertia` to undefined here.)
            camera.cameraRotation.x = 0.1;
            camera._checkInputs();
            const afterFirst = camera.rotation.x;
            expect(Number.isFinite(afterFirst)).toBe(true);
            expect(afterFirst).toBeCloseTo(0.1, 5);

            // No new input: the default-inertia glide must still advance by a finite, decayed amount.
            camera._checkInputs();
            const afterSecond = camera.rotation.x;
            expect(Number.isFinite(afterSecond)).toBe(true);
            expect(afterSecond).toBeGreaterThan(afterFirst);
        });

        it("writes through to the movement system immediately when set", () => {
            camera.inertia = 0.5;
            expect(camera.movement.panInertia).toBe(0.5);
            expect(camera.movement.rotationInertia).toBe(0.5);
            // The getter reflects the stored value.
            expect(camera.inertia).toBe(0.5);
        });

        it("does not clobber a directly-tuned movement inertia on each frame", () => {
            // Previously _checkInputs re-synced inertia every frame, overwriting direct tuning.
            // Now the camera only pushes inertia when its own `inertia` property is set.
            camera.movement.panInertia = 0.2;
            camera.movement.rotationInertia = 0.2;
            camera._checkInputs();
            expect(camera.movement.panInertia).toBe(0.2);
            expect(camera.movement.rotationInertia).toBe(0.2);
        });
    });

    describe("legacy epsilon glide cutoff", () => {
        it("stops rotational glide once the per-frame delta falls below _rotationEpsilon", () => {
            camera.inertia = 0.9;
            camera.cameraRotation.x = 0.1;
            camera._checkInputs();
            const afterFirst = camera.rotation.x;

            // Raise the rotation epsilon so the next decayed glide delta is below _rotationEpsilon.
            camera._rotationEpsilon = 10;
            camera._checkInputs();
            const afterSecond = camera.rotation.x;

            // Glide is cut off at the legacy threshold: rotation does not advance further.
            expect(afterSecond).toBe(afterFirst);

            // The cutoff also resets the velocity, so a subsequent frame produces no movement either.
            camera._checkInputs();
            expect(camera.rotation.x).toBe(afterFirst);
        });

        it("stops translational glide once the per-frame delta falls below speed * _panningEpsilon", () => {
            camera.inertia = 0.9;
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.copyFromFloats(0, 0, 1);
            camera._checkInputs();
            const afterFirst = camera.position.z;

            // Raise the panning epsilon so the next decayed glide delta is below speed * _panningEpsilon.
            camera._panningEpsilon = 10;
            camera._checkInputs();

            // Glide is cut off at the legacy threshold: position does not advance further.
            expect(camera.position.z).toBe(afterFirst);
            // The cutoff also resets the velocity, so a subsequent frame produces no movement either.
            camera._checkInputs();
            expect(camera.position.z).toBe(afterFirst);
        });

        // Regression: the cutoff must only end the decaying inertial tail, never an active-input
        // frame. A small rotation input (typical of ordinary mouse-look) below the epsilon limit
        // must still be applied; gating the cutoff before the apply used to discard it, making the
        // camera feel unresponsive.
        it("still applies an active rotation input even when it is below _rotationEpsilon", () => {
            camera.inertia = 0;
            const before = camera.rotation.x;

            // Raise the epsilon so any plausible per-frame mouse-look delta is below the limit,
            // then feed a tiny active rotation input on this frame.
            camera._rotationEpsilon = 10;
            camera.cameraRotation.x = 1e-4;
            camera._checkInputs();

            expect(camera.rotation.x).not.toBe(before);
            expect(camera.rotation.x).toBeCloseTo(before + 1e-4, 6);
        });

        it("still applies an active translation input even when it is below speed * _panningEpsilon", () => {
            camera.inertia = 0;
            camera.position.copyFromFloats(0, 0, 0);

            // Raise the epsilon so the active translation delta is below the limit.
            camera._panningEpsilon = 10;
            camera.cameraDirection.copyFromFloats(0, 0, 1e-4);
            camera._checkInputs();

            expect(camera.position.z).not.toBe(0);
            expect(camera.position.z).toBeCloseTo(1e-4, 6);
        });

        // Regression (forum 61001): rotation magnitude does not scale with `camera.speed`
        // (FreeCamera rotation uses `angularSensibility`), so the rotation glide cutoff must not be
        // scaled by `speed`. Otherwise raising `speed` truncates the rotation inertia tail earlier
        // without making rotation any faster. The glide must settle at the same total either way.
        it("rotation glide settles at the same total regardless of camera.speed", () => {
            const runGlide = (speed: number): number => {
                const cam = new FreeCamera("t", new Vector3(0, 0, 0), scene!);
                cam.speed = speed;
                cam.inertia = 0.9;
                cam.cameraRotation.x = 0.1;
                for (let i = 0; i < 500; i++) {
                    cam._checkInputs();
                }
                const total = cam.rotation.x;
                cam.dispose();
                return total;
            };
            const slow = runGlide(1);
            const fast = runGlide(50);
            expect(slow).toBeGreaterThan(0);
            expect(fast).toBeCloseTo(slow, 6);
        });
    });
});
