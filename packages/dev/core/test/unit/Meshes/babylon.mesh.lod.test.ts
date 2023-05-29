import { ArcRotateCamera, Camera } from "core/Cameras";
import { BoundingSphere } from "core/Culling";
import type { Engine } from "core/Engines";
import { Constants, NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import type { Mesh } from "core/Meshes";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

describe("Babylon Mesh Levels of Details", () => {
    let subject: Engine;
    let scene: Scene;

    let knot0: Mesh;
    let knot1: Mesh;
    let knot2: Mesh;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(subject);

        knot0 = MeshBuilder.CreateTorusKnot(
            "Knot0",
            {
                radius: 10,
                tube: 3,
                radialSegments: 128,
                tubularSegments: 64,
                p: 2,
                q: 3,
            },
            scene
        );
        knot1 = MeshBuilder.CreateTorusKnot(
            "Knot1",
            {
                radius: 10,
                tube: 3,
                radialSegments: 64,
                tubularSegments: 32,
                p: 2,
                q: 3,
            },
            scene
        );
        knot2 = MeshBuilder.CreateTorusKnot(
            "Knot2",
            {
                radius: 10,
                tube: 3,
                radialSegments: 32,
                tubularSegments: 16,
                p: 2,
                q: 3,
            },
            scene
        );
    });

    describe("getLOD method", () => {
        let cameraArc: ArcRotateCamera;
        let cameraOrthographic: ArcRotateCamera;

        beforeEach(() => {
            cameraArc = new ArcRotateCamera("Camera", 0, 0, 5, new Vector3(0, 0, 0), scene);

            cameraOrthographic = new ArcRotateCamera("Camera", 0, 0, 5, new Vector3(0, 0, 0), scene);
            cameraOrthographic.mode = Camera.ORTHOGRAPHIC_CAMERA;
        });

        it("should return self mesh when lods are not defined", () => {
            cameraArc.radius = 15;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");

            cameraArc.radius = 25;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");
        });

        it("should add lod level by chaining", () => {
            knot0.addLODLevel(10, knot1).addLODLevel(20, knot2);

            cameraArc.radius = 15;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot1");

            cameraArc.radius = 25;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot2");
        });

        describe("check LOD by distance", () => {
            beforeEach(() => {
                knot0.addLODLevel(10, knot1);
                knot0.addLODLevel(20, knot2);
            });

            it("should select lod with correct distance", () => {
                expect(knot0.getLOD(cameraArc)).not.toBeNull();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");

                cameraArc.radius = 15;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot1");

                cameraArc.radius = 25;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot2");
            });

            it("should select lod with correct distance for orthographic camera", () => {
                expect(knot0.getLOD(cameraOrthographic)).not.toBeNull();
                expect(knot0.getLOD(cameraOrthographic)!.name).toEqual("Knot0");

                cameraOrthographic.minZ = 15;
                scene.render();
                expect(knot0.getLOD(cameraOrthographic)!.name).toEqual("Knot1");

                cameraOrthographic.minZ = 25;
                scene.render();
                expect(knot0.getLOD(cameraOrthographic)!.name).toEqual("Knot2");
            });

            it("should select loaded mesh while target lod mesh is not loaded yet", () => {
                // not loaded yet
                knot1.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
                knot2.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;

                cameraArc.radius = 15;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");

                cameraArc.radius = 25;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");

                // while loading
                knot1.delayLoadState = Constants.DELAYLOADSTATE_LOADING;
                knot2.delayLoadState = Constants.DELAYLOADSTATE_LOADING;

                cameraArc.radius = 15;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");

                cameraArc.radius = 25;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");

                // after loaded
                knot1.delayLoadState = Constants.DELAYLOADSTATE_LOADED;
                knot2.delayLoadState = Constants.DELAYLOADSTATE_LOADED;

                cameraArc.radius = 15;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot1");

                cameraArc.radius = 25;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot2");
            });

            it("should call user function with selected LOD", () => {
                const onLODLevelSelectionArgs: {
                    distance?: number;
                    meshName?: string;
                    selectedLevel?: string | null;
                } = {};
                knot0.onLODLevelSelection = (_distance, _mesh, _selectedLevel) => {
                    onLODLevelSelectionArgs.distance = _distance;
                    onLODLevelSelectionArgs.meshName = _mesh.name;
                    onLODLevelSelectionArgs.selectedLevel = _selectedLevel?.name;
                    return null;
                };

                const registerSpy = jest.spyOn(knot0, "onLODLevelSelection");

                expect(registerSpy).toBeCalledTimes(0);

                scene.render();
                expect(registerSpy).toBeCalledTimes(1);
                expect(onLODLevelSelectionArgs.distance).toBeCloseTo(5.23, 2);
                expect(onLODLevelSelectionArgs.meshName).toEqual("Knot0");
                expect(onLODLevelSelectionArgs.selectedLevel).toEqual("Knot0");

                cameraArc.radius = 15;
                scene.render();
                expect(registerSpy).toBeCalledTimes(2);
                expect(onLODLevelSelectionArgs.distance).toBeCloseTo(15.07, 2);
                expect(onLODLevelSelectionArgs.meshName).toEqual("Knot0");
                expect(onLODLevelSelectionArgs.selectedLevel).toEqual("Knot1");

                cameraArc.radius = 25;
                scene.render();
                expect(registerSpy).toBeCalledTimes(3);
                expect(onLODLevelSelectionArgs.distance).toBeCloseTo(25.03, 2);
                expect(onLODLevelSelectionArgs.meshName).toEqual("Knot0");
                expect(onLODLevelSelectionArgs.selectedLevel).toEqual("Knot2");
            });
        });

        describe("check LOD by screen coverage", () => {
            beforeEach(() => {
                knot0.useLODScreenCoverage = true;
                knot0.addLODLevel(0.5, knot1);
                knot0.addLODLevel(0.2, knot2);
                knot0.addLODLevel(0.02, null);
            });

            it("should select lod with correct screen coverage", () => {
                cameraArc.radius = 80;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot1");

                cameraArc.radius = 120;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot2");

                cameraArc.radius = 380;
                scene.render();
                expect(knot0.getLOD(cameraArc)).toBeNull();
            });
        });

        describe("useLODScreenCoverage", () => {
            it("should work correctly when set to true at any time relative to addLODLevel mesh", () => {
                // Set LOD meshes
                knot0.addLODLevel(0.5, knot1);
                knot0.addLODLevel(0.2, knot2);
                knot0.addLODLevel(0.02, null);

                // Then set useLODScreenCoverage to true
                knot0.useLODScreenCoverage = true;

                // And it should work correctly
                cameraArc.radius = 80;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot1");

                cameraArc.radius = 120;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot2");

                cameraArc.radius = 380;
                scene.render();
                expect(knot0.getLOD(cameraArc)).toBeNull();
            });
        });

        describe("check custom boundingSphere", () => {
            it("should use custom boundingSphere", () => {
                const customBoundingSphere = new BoundingSphere(new Vector3(0, 0, 0), new Vector3(1, 1, 1));

                // Set LOD meshes
                knot0.addLODLevel(10, knot1);
                knot0.addLODLevel(20, knot2);

                cameraArc.radius = 10;
                scene.render();
                expect(knot0.getLOD(cameraArc, customBoundingSphere)!.name).toEqual("Knot0");

                cameraArc.radius = 11;
                scene.render();
                expect(knot0.getLOD(cameraArc, customBoundingSphere)!.name).toEqual("Knot1");

                cameraArc.radius = 21;
                scene.render();
                expect(knot0.getLOD(cameraArc, customBoundingSphere)!.name).toEqual("Knot2");
            });
        });
    });

    describe("removeLODLevel", () => {
        let cameraArc: ArcRotateCamera;

        beforeEach(() => {
            cameraArc = new ArcRotateCamera("Camera", 0, 0, 5, new Vector3(0, 0, 0), scene);
        });

        it("should remove lod level", () => {
            knot0.addLODLevel(10, knot1);
            knot0.addLODLevel(20, knot2);

            knot0.removeLODLevel(knot1);
            knot0.removeLODLevel(knot2);

            // After remove lod levels, the LOD should be the original mesh with any radius
            [5, 15, 25].forEach((radius) => {
                cameraArc.radius = radius;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");
            });

            // And no one lod level should be left
            expect(knot0.getLODLevels().length).toEqual(0);
        });

        it("should remove lod levels with chaining", () => {
            knot0.addLODLevel(10, knot1);
            knot0.addLODLevel(20, knot2);

            knot0.removeLODLevel(knot1).removeLODLevel(knot2);

            // After remove lod levels, the LOD should be the original mesh with any radius
            [5, 15, 25].forEach((radius) => {
                cameraArc.radius = radius;
                scene.render();
                expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");
            });

            // And no one lod level should be left
            expect(knot0.getLODLevels().length).toEqual(0);
        });

        it("should remove lod level with null mesh", () => {
            knot0.addLODLevel(10, knot1);
            knot0.addLODLevel(20, knot2);
            knot0.addLODLevel(30, null);

            knot0.removeLODLevel(knot1);
            knot0.removeLODLevel(knot2);
            knot0.removeLODLevel(null);

            // And no one lod level should be left
            expect(knot0.getLODLevels().length).toEqual(0);

            // And the getLOD should return the original mesh with radius relative to null by previous LOD level
            cameraArc.radius = 35;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual("Knot0");
        });
    });

    describe("getLODLevelAtDistance", () => {
        it("should return the lod level at distance", () => {
            knot0.addLODLevel(10, knot1);
            knot0.addLODLevel(20, knot2);
            knot0.addLODLevel(30, null);

            expect(knot0.getLODLevelAtDistance(9)).toBeNull();
            expect(knot0.getLODLevelAtDistance(10)).toEqual(knot1);
            expect(knot0.getLODLevelAtDistance(19)).toBeNull();
            expect(knot0.getLODLevelAtDistance(20)).toEqual(knot2);
            expect(knot0.getLODLevelAtDistance(29)).toBeNull();
            expect(knot0.getLODLevelAtDistance(30)).toBeNull();
        });
    });

    describe("addLODLevel", () => {
        it("should not possible add one mesh twice", () => {
            knot0.addLODLevel(10, knot1);
            knot0.addLODLevel(20, knot1);
            knot0.addLODLevel(30, knot1);

            expect(knot0.getLODLevels().length).toEqual(1);
        });
    });
});
