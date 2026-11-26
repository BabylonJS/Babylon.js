import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { VertexBuffer } from "core/Buffers/buffer";
import { type Mesh } from "core/Meshes/mesh";
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

        it("shows the unmasked half of a half dome along the camera's view (right handed, level camera at yaw -PI/2)", () => {
            const scene = new Scene(engine);
            scene.useRightHandedSystem = true;
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            camera.rotation.set(0, -Math.PI / 2, 0);

            const dome = new PhotoDome("dome", "dome.jpg", { resolution: 8, size: 10, halfDomeMode: true }, scene);

            // The mask covers one hemisphere; the visible side points away from the mask's centroid in world space.
            const mask = (dome as any)._halfDomeMask as Mesh;
            dome.computeWorldMatrix(true);
            dome.mesh.computeWorldMatrix(true);
            const maskWorld = mask.computeWorldMatrix(true);
            const positions = mask.getVerticesData(VertexBuffer.PositionKind)!;
            const centroid = Vector3.Zero();
            for (let i = 0; i < positions.length; i += 3) {
                centroid.addInPlace(Vector3.TransformCoordinates(Vector3.FromArray(positions, i), maskWorld));
            }
            const unmasked = centroid.negate().normalize();

            camera.getViewMatrix();
            const viewRay = camera.getTarget().subtract(camera.position).normalize();
            expect(viewRay.x).toBeCloseTo(1, 6);
            expect(unmasked.x).toBeCloseTo(1, 1);
            expect(Vector3.Dot(unmasked, viewRay)).toBeGreaterThan(0.99);
        });

        it("faces the new camera direction when created inside onViewMatrixChangedObservable", () => {
            const scene = new Scene(engine);
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            camera.rotation.set(0, 0, 0);
            camera.getViewMatrix();

            let dome: PhotoDome | undefined;
            camera.onViewMatrixChangedObservable.addOnce(() => {
                dome = new PhotoDome("dome", "dome.jpg", { resolution: 8, size: 10 }, scene);
            });
            camera.rotation.set(0, 0.5, 0);
            camera.getViewMatrix();

            expect(dome).toBeDefined();
            expect(dome!.rotation.y).toBeCloseTo(0.5, 6);
        });

        it("leaves the dome unrotated when faceForward is false", () => {
            const scene = new Scene(engine);
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            camera.rotation.set(0, 1, 0);

            const dome = new PhotoDome("dome", "dome.jpg", { resolution: 8, size: 10, faceForward: false }, scene);

            expect(dome.rotation.y).toBe(0);
        });
    });
});
