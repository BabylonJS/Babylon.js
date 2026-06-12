import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TargetCamera } from "core/Cameras/targetCamera";
import { TargetCameraMovement } from "core/Cameras/targetCameraMovement";
import { FreeCamera } from "core/Cameras/freeCamera";
import { TouchCamera } from "core/Cameras/touchCamera";
import { GamepadCamera } from "core/Cameras/gamepadCamera";
import { DeviceOrientationCamera } from "core/Cameras/deviceOrientationCamera";
import { VirtualJoysticksCamera } from "core/Cameras/virtualJoysticksCamera";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { AnaglyphFreeCamera } from "core/Cameras/Stereoscopic/anaglyphFreeCamera";
import { StereoscopicFreeCamera } from "core/Cameras/Stereoscopic/stereoscopicFreeCamera";
import { StereoscopicScreenUniversalCamera } from "core/Cameras/Stereoscopic/stereoscopicScreenUniversalCamera";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { type Nullable } from "core/types";

/**
 * These subclasses all derive from FreeCamera (directly or via TouchCamera/UniversalCamera)
 * and therefore inherit the TargetCamera movement wiring without any per-class changes.
 * The tests below assert the port-by-inheritance contract: every subclass exposes a
 * TargetCameraMovement, the default pointer-to-rotate map, and the framerate-independent
 * translate/rotate fold applied by TargetCamera._checkInputs.
 */
describe("FreeCamera subclasses inherit TargetCameraMovement", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
    });

    const factories: Array<{ name: string; create: () => TargetCamera }> = [
        { name: "FreeCamera", create: () => new FreeCamera("free", new Vector3(0, 0, 0), scene!) },
        { name: "TouchCamera", create: () => new TouchCamera("touch", new Vector3(0, 0, 0), scene!) },
        { name: "GamepadCamera", create: () => new GamepadCamera("gamepad", new Vector3(0, 0, 0), scene!) },
        { name: "DeviceOrientationCamera", create: () => new DeviceOrientationCamera("orientation", new Vector3(0, 0, 0), scene!) },
        { name: "VirtualJoysticksCamera", create: () => new VirtualJoysticksCamera("joystick", new Vector3(0, 0, 0), scene!) },
        { name: "UniversalCamera", create: () => new UniversalCamera("universal", new Vector3(0, 0, 0), scene!) },
        { name: "AnaglyphFreeCamera", create: () => new AnaglyphFreeCamera("anaglyph", new Vector3(0, 0, 0), 0.0637, scene!) },
        { name: "StereoscopicFreeCamera", create: () => new StereoscopicFreeCamera("stereo", new Vector3(0, 0, 0), 0.0637, true, scene!) },
        { name: "StereoscopicScreenUniversalCamera", create: () => new StereoscopicScreenUniversalCamera("stereoScreen", new Vector3(0, 0, 0), scene!) },
    ];

    describe.each(factories)("$name", ({ create }) => {
        it("exposes a TargetCameraMovement instance", () => {
            const camera = create();
            expect(camera.movement).toBeInstanceOf(TargetCameraMovement);
        });

        it("inherits the default pointer->rotate input map", () => {
            const camera = create();
            expect(camera.movement.input.resolveInteraction("pointer", { button: 0 })?.interaction).toBe("rotate");
        });

        it("applies a framerate-independent rotation via the cameraRotation fold", () => {
            const camera = create();
            camera.cameraRotation.x = 0.1;
            camera.cameraRotation.y = 0.2;
            camera._checkInputs();

            expect(camera.rotation.x).toBeCloseTo(0.1, 5);
            expect(camera.rotation.y).toBeCloseTo(0.2, 5);
            // The fold consumes the raw input so it is not re-applied next frame.
            expect(camera.cameraRotation.x).toBe(0);
            expect(camera.cameraRotation.y).toBe(0);
        });

        it("applies a framerate-independent translation via the cameraDirection fold", () => {
            const camera = create();
            camera.position.copyFromFloats(0, 0, 0);
            camera.cameraDirection.copyFromFloats(0, 0, 1);
            camera._checkInputs();

            expect(camera.position.z).toBeCloseTo(1, 5);
            expect(camera.cameraDirection.x).toBe(0);
            expect(camera.cameraDirection.y).toBe(0);
            expect(camera.cameraDirection.z).toBe(0);
        });
    });
});
