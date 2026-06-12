import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FlyCamera } from "core/Cameras/flyCamera";
import { TargetCameraMovement } from "core/Cameras/targetCameraMovement";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type Nullable } from "core/types";

describe("FlyCamera movement", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: FlyCamera;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        camera = new FlyCamera("test", new Vector3(0, 0, 0), scene);
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    describe("always-on movement", () => {
        it("shares the TargetCameraMovement system", () => {
            expect(camera.movement).toBeInstanceOf(TargetCameraMovement);
        });

        it("maps pointer drag to rotate by default", () => {
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
            expect(camera.movement.input.resolveInteraction("pointer", { button: 2 })?.interaction).toBe("rotate");
        });
    });

    describe("_checkInputs reference-framerate translation", () => {
        it("applies a single-frame translation equal to the legacy cameraDirection value", () => {
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.copyFromFloats(0, 0, 1);
            camera._checkInputs();

            expect(camera.position.z).toBeCloseTo(1, 5);
            expect(camera.cameraDirection.x).toBe(0);
            expect(camera.cameraDirection.y).toBe(0);
            expect(camera.cameraDirection.z).toBe(0);
        });

        it("continues to translate via inertial glide after input stops", () => {
            camera.inertia = 0.9;
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.copyFromFloats(0, 0, 1);
            camera._checkInputs();
            const afterFirst = camera.position.z;

            camera._checkInputs();
            const afterSecond = camera.position.z;

            expect(afterSecond).toBeGreaterThan(afterFirst);
            expect(afterSecond - afterFirst).toBeLessThan(afterFirst);
        });
    });

    describe("FlyCameraMouseInput respects the configurable input map", () => {
        it("returns null when the pointer interaction is unmapped, so the mouse input will not rotate", () => {
            camera.movement.input.inputMap = [];
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0 })).toBeNull();
        });
    });
});
