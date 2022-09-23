import { BoundingBox, BoundingInfo, BoundingSphere } from "core/Culling";
import { Engine, NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { Mesh } from "core/Meshes";
import { CloudPoint, PointsCloudSystem, PointsGroup } from "core/Particles";
import { Scene } from "core/scene";
import { DeepImmutable } from "core/types";

describe("CloudPoint", () => {
    describe("intersectsMesh", () => {
        let subject: Engine;

        let pointsGroup: PointsGroup;
        let scene: Scene;

        let pointsCloudSystemWithoutMesh: PointsCloudSystem;
        let cloudPointWithoutMesh: CloudPoint;

        let pointsCloudSystemWithMesh: PointsCloudSystem;
        let cloudPointWithMesh: CloudPoint;

        /**
         * Create a new engine subject before each test.
         */
        beforeEach(async () => {
            subject = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });

            pointsGroup = new PointsGroup(1, () => {});
            scene = new Scene(subject);

            pointsCloudSystemWithoutMesh = new PointsCloudSystem("cloud-system", 1, scene);
            cloudPointWithoutMesh = new CloudPoint(1, pointsGroup, 1, 0, pointsCloudSystemWithoutMesh);

            pointsCloudSystemWithMesh = new PointsCloudSystem("cloud-system", 1, scene);
            await pointsCloudSystemWithMesh.buildMeshAsync();
            cloudPointWithMesh = new CloudPoint(1, pointsGroup, 1, 0, pointsCloudSystemWithMesh);
        });

        // Check the hasBoundingInfo
        it("should return False when target doesnt contain Bounding Info", () => {
            const mesh = {} as Mesh;
            const result = cloudPointWithoutMesh.intersectsMesh(mesh, false);

            expect(result).toBeFalsy();
        });

        // Check throw Error
        it("should throw an error if Point Cloud System doesnt have a Mesh", () => {
            const isIntersects = true;

            const boundingInfo = {
                boundingSphere: {
                    intersectsPoint: (_point: DeepImmutable<Vector3>) => isIntersects,
                } as BoundingSphere,
            } as BoundingInfo;

            const mesh = {
                hasBoundingInfo: true,
                getBoundingInfo: () => boundingInfo,
            } as Mesh;

            expect(() => cloudPointWithoutMesh.intersectsMesh(mesh, true)).toThrowError();
        });

        // Check intersect by sphere
        it("should return True when target intersects with Point Cloud by sphere", () => {
            const isIntersects = true;

            const boundingInfo = {
                boundingSphere: {
                    intersectsPoint: (_point: DeepImmutable<Vector3>) => isIntersects,
                } as BoundingSphere,
            } as BoundingInfo;

            const mesh = {
                hasBoundingInfo: true,
                getBoundingInfo: () => boundingInfo,
            } as Mesh;

            const result = cloudPointWithMesh.intersectsMesh(mesh, true);

            expect(result).toBeTruthy();
        });

        it("should return False when target dont intersects with Point Cloud by sphere", () => {
            const isIntersects = false;

            const boundingInfo = {
                boundingSphere: {
                    intersectsPoint: (_point: DeepImmutable<Vector3>) => isIntersects,
                } as BoundingSphere,
            } as BoundingInfo;

            const mesh = {
                hasBoundingInfo: true,
                getBoundingInfo: () => boundingInfo,
            } as Mesh;

            const result = cloudPointWithMesh.intersectsMesh(mesh, true);

            expect(result).toBeFalsy();
        });

        // Check real intersects
        describe("should check real intersects", () => {
            const boundingBoxLimits = [
                { min: [-1, -1, -1], max: [-1, -1, -1], result: false },
                { min: [-1, -1, -1], max: [0, 0, -1], result: false },
                { min: [-1, -1, -1], max: [0, 0, 0], result: true },
                { min: [-1, -1, -1], max: [0, 0, 1], result: true },
                { min: [-1, -1, -1], max: [0, 1, -1], result: false },
                { min: [-1, -1, -1], max: [0, 1, 0], result: true },
                { min: [-1, -1, -1], max: [0, 1, 1], result: true },
                { min: [-1, -1, -1], max: [1, -1, -1], result: false },
                { min: [-1, -1, -1], max: [1, 0, -1], result: false },
                { min: [-1, -1, -1], max: [1, 0, 0], result: true },
                { min: [-1, -1, -1], max: [1, 0, 1], result: true },
                { min: [-1, -1, -1], max: [1, 1, -1], result: false },
                { min: [-1, -1, -1], max: [1, 1, 0], result: true },
                { min: [-1, -1, -1], max: [1, 1, 1], result: true },
                { min: [-1, -1, 0], max: [-1, -1, -1], result: false },
                { min: [-1, -1, 0], max: [0, 0, -1], result: false },
                { min: [-1, -1, 0], max: [0, 0, 0], result: true },
                { min: [-1, -1, 0], max: [0, 0, 1], result: true },
                { min: [-1, -1, 0], max: [0, 1, -1], result: false },
                { min: [-1, -1, 0], max: [0, 1, 0], result: true },
                { min: [-1, -1, 0], max: [0, 1, 1], result: true },
                { min: [-1, -1, 0], max: [1, -1, -1], result: false },
                { min: [-1, -1, 0], max: [1, 0, -1], result: false },
                { min: [-1, -1, 0], max: [1, 0, 0], result: true },
                { min: [-1, -1, 0], max: [1, 0, 1], result: true },
                { min: [-1, -1, 0], max: [1, 1, -1], result: false },
                { min: [-1, -1, 0], max: [1, 1, 0], result: true },
                { min: [-1, -1, 0], max: [1, 1, 1], result: true },
                { min: [-1, -1, 1], max: [-1, -1, -1], result: false },
                { min: [-1, 0, -1], max: [0, 0, -1], result: false },
                { min: [-1, 0, -1], max: [0, 0, 0], result: true },
                { min: [-1, 0, -1], max: [0, 0, 1], result: true },
                { min: [-1, 0, -1], max: [0, 1, -1], result: false },
                { min: [-1, 0, -1], max: [0, 1, 0], result: true },
                { min: [-1, 0, -1], max: [0, 1, 1], result: true },
                { min: [-1, 0, -1], max: [1, -1, -1], result: false },
                { min: [-1, 0, -1], max: [1, 0, -1], result: false },
                { min: [-1, 0, -1], max: [1, 0, 0], result: true },
                { min: [-1, 0, -1], max: [1, 0, 1], result: true },
                { min: [-1, 0, -1], max: [1, 1, -1], result: false },
                { min: [-1, 0, -1], max: [1, 1, 0], result: true },
                { min: [-1, 0, -1], max: [1, 1, 1], result: true },
                { min: [-1, 0, 0], max: [-1, -1, -1], result: false },
                { min: [-1, 0, 0], max: [0, 0, -1], result: false },
                { min: [-1, 0, 0], max: [0, 0, 0], result: true },
                { min: [-1, 0, 0], max: [0, 0, 1], result: true },
                { min: [-1, 0, 0], max: [0, 1, -1], result: false },
                { min: [-1, 0, 0], max: [0, 1, 0], result: true },
                { min: [-1, 0, 0], max: [0, 1, 1], result: true },
                { min: [-1, 0, 0], max: [1, -1, -1], result: false },
                { min: [-1, 0, 0], max: [1, 0, -1], result: false },
                { min: [-1, 0, 0], max: [1, 0, 0], result: true },
                { min: [-1, 0, 0], max: [1, 0, 1], result: true },
                { min: [-1, 0, 0], max: [1, 1, -1], result: false },
                { min: [-1, 0, 0], max: [1, 1, 0], result: true },
                { min: [-1, 0, 0], max: [1, 1, 1], result: true },
                { min: [-1, 0, 1], max: [-1, -1, -1], result: false },
                { min: [0, -1, -1], max: [0, 0, -1], result: false },
                { min: [0, -1, -1], max: [0, 0, 0], result: true },
                { min: [0, -1, -1], max: [0, 0, 1], result: true },
                { min: [0, -1, -1], max: [0, 1, -1], result: false },
                { min: [0, -1, -1], max: [0, 1, 0], result: true },
                { min: [0, -1, -1], max: [0, 1, 1], result: true },
                { min: [0, -1, -1], max: [1, -1, -1], result: false },
                { min: [0, -1, -1], max: [1, 0, -1], result: false },
                { min: [0, -1, -1], max: [1, 0, 0], result: true },
                { min: [0, -1, -1], max: [1, 0, 1], result: true },
                { min: [0, -1, -1], max: [1, 1, -1], result: false },
                { min: [0, -1, -1], max: [1, 1, 0], result: true },
                { min: [0, -1, -1], max: [1, 1, 1], result: true },
                { min: [0, -1, 0], max: [-1, -1, -1], result: false },
                { min: [0, -1, 0], max: [0, 0, -1], result: false },
                { min: [0, -1, 0], max: [0, 0, 0], result: true },
                { min: [0, -1, 0], max: [0, 0, 1], result: true },
                { min: [0, -1, 0], max: [0, 1, -1], result: false },
                { min: [0, -1, 0], max: [0, 1, 0], result: true },
                { min: [0, -1, 0], max: [0, 1, 1], result: true },
                { min: [0, -1, 0], max: [1, -1, -1], result: false },
                { min: [0, -1, 0], max: [1, 0, -1], result: false },
                { min: [0, -1, 0], max: [1, 0, 0], result: true },
                { min: [0, -1, 0], max: [1, 0, 1], result: true },
                { min: [0, -1, 0], max: [1, 1, -1], result: false },
                { min: [0, -1, 0], max: [1, 1, 0], result: true },
                { min: [0, -1, 0], max: [1, 1, 1], result: true },
                { min: [0, -1, 1], max: [-1, -1, -1], result: false },
                { min: [0, 0, -1], max: [0, 0, -1], result: false },
                { min: [0, 0, -1], max: [0, 0, 0], result: true },
                { min: [0, 0, -1], max: [0, 0, 1], result: true },
                { min: [0, 0, -1], max: [0, 1, -1], result: false },
                { min: [0, 0, -1], max: [0, 1, 0], result: true },
                { min: [0, 0, -1], max: [0, 1, 1], result: true },
                { min: [0, 0, -1], max: [1, -1, -1], result: false },
                { min: [0, 0, -1], max: [1, 0, -1], result: false },
                { min: [0, 0, -1], max: [1, 0, 0], result: true },
                { min: [0, 0, -1], max: [1, 0, 1], result: true },
                { min: [0, 0, -1], max: [1, 1, -1], result: false },
                { min: [0, 0, -1], max: [1, 1, 0], result: true },
                { min: [0, 0, -1], max: [1, 1, 1], result: true },
                { min: [0, 0, 0], max: [-1, -1, -1], result: false },
                { min: [0, 0, 0], max: [0, 0, -1], result: false },
                { min: [0, 0, 0], max: [0, 0, 0], result: true },
                { min: [0, 0, 0], max: [0, 0, 1], result: true },
                { min: [0, 0, 0], max: [0, 1, -1], result: false },
                { min: [0, 0, 0], max: [0, 1, 0], result: true },
                { min: [0, 0, 0], max: [0, 1, 1], result: true },
                { min: [0, 0, 0], max: [1, -1, -1], result: false },
                { min: [0, 0, 0], max: [1, 0, -1], result: false },
                { min: [0, 0, 0], max: [1, 0, 0], result: true },
                { min: [0, 0, 0], max: [1, 0, 1], result: true },
                { min: [0, 0, 0], max: [1, 1, -1], result: false },
                { min: [0, 0, 0], max: [1, 1, 0], result: true },
                { min: [0, 0, 0], max: [1, 1, 1], result: true },
                { min: [0, 0, 1], max: [-1, -1, -1], result: false },
                { min: [0, 1, -1], max: [-1, -1, -1], result: false },
                { min: [0, 1, 0], max: [-1, -1, -1], result: false },
                { min: [0, 1, 1], max: [-1, -1, -1], result: false },
                { min: [1, -1, -1], max: [-1, -1, -1], result: false },
                { min: [1, -1, 0], max: [-1, -1, -1], result: false },
                { min: [1, -1, 1], max: [-1, -1, -1], result: false },
                { min: [1, 0, -1], max: [-1, -1, -1], result: false },
                { min: [1, 0, 0], max: [-1, -1, -1], result: false },
                { min: [1, 0, 1], max: [-1, -1, -1], result: false },
                { min: [1, 1, -1], max: [-1, -1, -1], result: false },
                { min: [1, 1, 0], max: [-1, -1, -1], result: false },
                { min: [1, 1, 1], max: [-1, -1, -1], result: false },
                { min: [1, 1, 1], max: [1, 1, 1], result: false },
            ];

            boundingBoxLimits.forEach((boundingBoxLimit, index) => {
                it("should return correct value for test case " + index, () => {
                    const boundingInfo = {
                        boundingBox: {
                            maximumWorld: {
                                x: boundingBoxLimit.max[0],
                                y: boundingBoxLimit.max[1],
                                z: boundingBoxLimit.max[2],
                            },
                            minimumWorld: {
                                x: boundingBoxLimit.min[0],
                                y: boundingBoxLimit.min[1],
                                z: boundingBoxLimit.min[2],
                            },
                        } as BoundingBox,
                    } as BoundingInfo;

                    const mesh = {
                        hasBoundingInfo: true,
                        getBoundingInfo: () => boundingInfo,
                    } as Mesh;

                    const result = cloudPointWithMesh.intersectsMesh(mesh, false);

                    expect(result).toEqual(boundingBoxLimit.result);
                });
            });
        });
    });
});
