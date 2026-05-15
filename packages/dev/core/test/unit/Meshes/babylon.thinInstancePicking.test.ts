import { type Engine, NullEngine } from "core/Engines";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { type Mesh, MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";
import { PickingInfo } from "core/Collisions/pickingInfo";
import { PickingCustomization, Ray } from "core/Culling/ray";
import "core/Culling/ray";
import "core/Meshes/thinInstanceMesh";

describe("ThinInstance picking", () => {
    let engine: Engine;
    let scene: Scene;
    let box: Mesh;

    /**
     * Creates thin instances of `box` at (0,0,0), (5,0,0) and (10,0,0).
     */
    function createThinInstancesOnXAxis() {
        const m0 = Matrix.Translation(0, 0, 0);
        const m1 = Matrix.Translation(5, 0, 0);
        const m2 = Matrix.Translation(10, 0, 0);

        box.thinInstanceAdd(m0, false);
        box.thinInstanceAdd(m1, false);
        box.thinInstanceAdd(m2, true);
        box.thinInstanceEnablePicking = true;
    }

    function createThinInstancesAroundAggregateRayGap() {
        box.thinInstanceAdd(Matrix.Translation(0, 0, 0), false);
        box.thinInstanceAdd(Matrix.Translation(10, 0, 0), true);
        box.thinInstanceEnablePicking = true;
    }

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        // NullEngine reports no instancedArrays support by default; thinInstanceAdd requires it.
        engine.getCaps().instancedArrays = true;
        scene = new Scene(engine);
        box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
    });

    afterEach(() => {
        PickingCustomization.internalPickerForMesh = undefined;
        scene.dispose();
        engine.dispose();
    });

    describe("pickWithRay", () => {
        it("returns the correct thinInstanceIndex for a ray hitting a specific instance", () => {
            createThinInstancesOnXAxis();

            // Ray straight down through the instance at x=5
            const ray = new Ray(new Vector3(5, 5, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            expect(info).toBeTruthy();
            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(1);
            expect(info!.pickedMesh).toBe(box);
            expect(info!.pickedPoint!.x).toBeCloseTo(5);
            expect(info!.pickedPoint!.y).toBeCloseTo(0.5);
            expect(info!.pickedPoint!.z).toBeCloseTo(0);
        });

        it("reports a miss when the ray does not intersect any thin instance", () => {
            createThinInstancesOnXAxis();

            const ray = new Ray(new Vector3(100, 5, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            // pickWithRay returns a PickingInfo with hit=false on miss.
            expect(info!.hit).toBe(false);
            expect(info!.thinInstanceIndex).toBe(-1);
        });

        it("picks the first instance along the ray when fastCheck is true", () => {
            createThinInstancesOnXAxis();

            // Horizontal ray passing through all 3 instances
            const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(1, 0, 0));
            const info = scene.pickWithRay(ray, undefined, true);

            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(0);
        });

        it("picks the closest instance along the ray when fastCheck is false", () => {
            createThinInstancesOnXAxis();

            const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(1, 0, 0));
            const info = scene.pickWithRay(ray, undefined, false);

            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(0);
            expect(info!.pickedPoint!.x).toBeCloseTo(-0.5);
        });

        it("honors the mesh world matrix on top of the thin-instance matrix", () => {
            createThinInstancesOnXAxis();

            // Lift the whole batch by y=10 via the mesh's own world matrix.
            box.position.set(0, 10, 0);
            box.computeWorldMatrix(true);

            // A ray at y=10 should hit instance 1 (at x=5, now y=10)
            const ray = new Ray(new Vector3(5, 20, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(1);
            expect(info!.pickedPoint!.y).toBeCloseTo(10.5);
        });

        it("observes in-place matrixData mutations followed by thinInstanceBufferUpdated", () => {
            createThinInstancesOnXAxis();

            // Move instance 1 from x=5 to x=2, staying within the aggregated mesh bounding box
            // so the outer (mesh-level) bounding check still succeeds.
            const matrixData = box._thinInstanceDataStorage.matrixData!;
            // Translation components are at offsets 12, 13, 14 of the 4x4 matrix stored in column-major form.
            matrixData[1 * 16 + 12] = 2;
            box.thinInstanceBufferUpdated("matrix");

            // Old position (x=5) no longer has an instance
            const oldRay = new Ray(new Vector3(5, 5, 0), new Vector3(0, -1, 0));
            const oldInfo = scene.pickWithRay(oldRay);
            expect(oldInfo!.hit).toBe(false);

            // New position (x=2) is picked and reports the correct thinInstanceIndex
            const newRay = new Ray(new Vector3(2, 5, 0), new Vector3(0, -1, 0));
            const newInfo = scene.pickWithRay(newRay);
            expect(newInfo!.hit).toBe(true);
            expect(newInfo!.thinInstanceIndex).toBe(1);
            expect(newInfo!.pickedPoint!.x).toBeCloseTo(2);
        });

        it("returns a world-space normal transformed by the thin-instance matrix", () => {
            // Single thin instance rotated 90deg around Z: the local +X face ends up facing world +Y.
            const rot = Matrix.RotationZ(Math.PI / 2);
            box.thinInstanceAdd(rot, true);
            box.thinInstanceEnablePicking = true;

            const ray = new Ray(new Vector3(0, 5, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(0);

            const normal = info!.getNormal(true, true);
            expect(normal).toBeTruthy();
            // Local face normal of the picked top side is (+1,0,0) in rotated-box-local space (it was +X pre-rotation).
            // RotationZ(+π/2) maps (1,0,0) -> (0,1,0). Ray direction is (0,-1,0); Dot=-1 so no flip.
            expect(normal!.x).toBeCloseTo(0);
            expect(normal!.y).toBeCloseTo(1);
            expect(normal!.z).toBeCloseTo(0);
        });

        it("picks thin instances with mirrored non-uniform transforms", () => {
            const transform = Matrix.Compose(new Vector3(-2, 0.5, 1.5), Quaternion.FromEulerAngles(0, 0, Math.PI / 4), new Vector3(3, 1, 0));
            box.thinInstanceAdd(transform, true);
            box.thinInstanceEnablePicking = true;

            const ray = new Ray(new Vector3(3, 5, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(0);
            expect(info!.pickedMesh).toBe(box);
        });

        it("preserves thin-instance picking when rawBoundingInfo is missing", () => {
            box.thinInstanceAdd(Matrix.Translation(5, 0, 0), false);
            box.thinInstanceAdd(Matrix.Translation(10, 0, 0), true);
            box.thinInstanceEnablePicking = true;

            expect(box.getBoundingInfo().boundingBox.minimum.x).toBeCloseTo(4.5);
            box.rawBoundingInfo = null;

            const ray = new Ray(new Vector3(5, 5, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(0);
            expect(info!.pickedMesh).toBe(box);
        });

        it("uses the line intersectionThreshold for thin-instance raw-bounds checks", () => {
            const line = MeshBuilder.CreateLines(
                "line",
                {
                    points: [new Vector3(0, -1, 0), new Vector3(0, 1, 0)],
                },
                scene
            );
            line.intersectionThreshold = 0.1;
            line.thinInstanceAdd(Matrix.Translation(5, 0, 0), true);
            line.thinInstanceEnablePicking = true;

            const ray = new Ray(new Vector3(5.05, 2, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            expect(info!.hit).toBe(true);
            expect(info!.thinInstanceIndex).toBe(0);
            expect(info!.pickedMesh).toBe(line);
        });

        it("rejects thin instances with raw bounds before triangle intersection", () => {
            createThinInstancesAroundAggregateRayGap();

            const ray = new Ray(new Vector3(5, 5, 0), new Vector3(0, -1, 0));
            let trianglePredicateCalled = false;
            const info = scene.pickWithRay(ray, undefined, false, () => {
                trianglePredicateCalled = true;
                return true;
            });

            expect(info!.hit).toBe(false);
            expect(trianglePredicateCalled).toBe(false);
        });

        it("does not raw-bounds reject thin instances before a custom picker", () => {
            createThinInstancesAroundAggregateRayGap();

            let thinInstancePickerCalls = 0;
            PickingCustomization.internalPickerForMesh = (_pickingInfo, _rayFunction, mesh, _world, _fastCheck, onlyBoundingInfo) => {
                if (onlyBoundingInfo) {
                    const result = new PickingInfo();
                    result.hit = true;
                    result.pickedMesh = mesh;
                    return result;
                }

                thinInstancePickerCalls++;
                return null!;
            };

            const ray = new Ray(new Vector3(5, 5, 0), new Vector3(0, -1, 0));
            const info = scene.pickWithRay(ray);

            expect(info!.hit).toBe(false);
            expect(thinInstancePickerCalls).toBe(2);
        });
    });

    describe("multiPickWithRay", () => {
        it("returns one PickingInfo per intersected thin instance", () => {
            createThinInstancesOnXAxis();

            const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(1, 0, 0));
            const infos = scene.multiPickWithRay(ray);

            expect(infos).toBeTruthy();
            expect(infos!.length).toBe(3);
            const indices = infos!.map((i) => i.thinInstanceIndex).sort((a, b) => a - b);
            expect(indices).toEqual([0, 1, 2]);
        });

        it("skips instances rejected by the predicate", () => {
            createThinInstancesOnXAxis();

            const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(1, 0, 0));
            const infos = scene.multiPickWithRay(ray, (_m, instanceIndex) => instanceIndex !== 1);

            expect(infos).toBeTruthy();
            const indices = infos!.map((i) => i.thinInstanceIndex).sort((a, b) => a - b);
            // Predicate also runs for the mesh-level pick (instanceIndex = -1), which is accepted.
            // For the thin-instance loop, index 1 is skipped.
            expect(indices).toEqual([0, 2]);
        });

        it("observes in-place matrixData mutations", () => {
            createThinInstancesOnXAxis();

            const matrixData = box._thinInstanceDataStorage.matrixData!;
            // Move instance 2 from x=10 to x=-20 (out of the ray path)
            matrixData[2 * 16 + 12] = -20;
            box.thinInstanceBufferUpdated("matrix");

            // Ray from x=-5 going +x will hit only instances 0 and 1 (and miss relocated 2)
            const ray = new Ray(new Vector3(-5, 0, 0), new Vector3(1, 0, 0));
            const infos = scene.multiPickWithRay(ray);

            expect(infos).toBeTruthy();
            const indices = infos!.map((i) => i.thinInstanceIndex).sort((a, b) => a - b);
            expect(indices).toEqual([0, 1]);
        });

        it("rejects thin instances with raw bounds before triangle intersection", () => {
            createThinInstancesAroundAggregateRayGap();

            const ray = new Ray(new Vector3(5, 5, 0), new Vector3(0, -1, 0));
            let trianglePredicateCalled = false;
            const infos = scene.multiPickWithRay(ray, undefined, () => {
                trianglePredicateCalled = true;
                return true;
            });

            expect(infos).toEqual([]);
            expect(trianglePredicateCalled).toBe(false);
        });

        it("does not raw-bounds reject thin instances before a custom picker", () => {
            createThinInstancesAroundAggregateRayGap();

            let thinInstancePickerCalls = 0;
            PickingCustomization.internalPickerForMesh = (_pickingInfo, _rayFunction, mesh, _world, _fastCheck, onlyBoundingInfo) => {
                if (onlyBoundingInfo) {
                    const result = new PickingInfo();
                    result.hit = true;
                    result.pickedMesh = mesh;
                    return result;
                }

                thinInstancePickerCalls++;
                return null!;
            };

            const ray = new Ray(new Vector3(5, 5, 0), new Vector3(0, -1, 0));
            const infos = scene.multiPickWithRay(ray);

            expect(infos).toEqual([]);
            expect(thinInstancePickerCalls).toBe(2);
        });
    });
});
