import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { PhotoDome } from "core/Helpers/photoDome";

describe("TextureDome", () => {
    let engine: NullEngine;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    afterEach(() => {
        engine.dispose();
    });

    describe("faceForward", () => {
        // [yaw, pitch] of the active camera
        const rotations = [
            [0.5, 0],
            [-0.5, 0],
            [-2, 0],
            [2.5, 0],
            [0, 0.5],
            [1, 0.4],
            [-1, -0.4],
        ];

        for (const useRightHandedSystem of [false, true]) {
            for (const [yaw, pitch] of rotations) {
                it(`turns the dome to the camera yaw (${useRightHandedSystem ? "right" : "left"} handed, yaw ${yaw}, pitch ${pitch})`, () => {
                    const scene = new Scene(engine);
                    scene.useRightHandedSystem = useRightHandedSystem;
                    const camera = new FreeCamera("camera", Vector3.Zero(), scene);
                    camera.rotation.set(pitch, yaw, 0);

                    const dome = new PhotoDome("dome", "dome.jpg", { resolution: 8, size: 10 }, scene);

                    const camFwd = camera.getDirection(Vector3.Forward(scene.useRightHandedSystem)).normalize();
                    const expectedAngle = Math.atan2(camFwd.x, camFwd.z);
                    expect(dome.rotation.y).toBeCloseTo(expectedAngle, 6);
                });
            }
        }

        it("leaves the dome unrotated when faceForward is false", () => {
            const scene = new Scene(engine);
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            camera.rotation.set(0, 1, 0);

            const dome = new PhotoDome("dome", "dome.jpg", { resolution: 8, size: 10, faceForward: false }, scene);

            expect(dome.rotation.y).toBe(0);
        });
    });
});
