import { ArcRotateCamera } from "core/Cameras";
import { OctreeSceneComponent } from "core/Culling";
import { Engine, NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

describe("OctreeSceneComponent", () => {
    describe("getActiveMeshCandidates", () => {
        let engine: Engine;
        let scene: Scene;

        const boxPositions = [
            [0, 1, 0],
            [1, 0, 1],
            [0, 0, 0],
            [0, 1, 1],
            [1, 1, 0],
            [1, 5, 1],
            [1, 1, 1],
            [1, -1, -1],
            [-1, 5, 1],
            [-1, -5, 1],
            [0, 8, 0],
            [8, 0, 8],
            [0, 0, 0],
            [0, 8, 8],
            [8, 8, 0],
            [8, 5, 8],
            [8, 8, 8],
            [8, -8, -8],
            [-4, 9, 4],
            [-4, -9, 4],
            [0, 4, 0],
            [-4, 0, 4],
            [0, 0, 0],
            [0, 4, 4],
            [-4, 4, 0],
            [-4, 9, 4],
            [-4, 4, 4],
            [-4, -4, -4],
            [4, 9, 4],
            [4, -9, 4],
        ];

        beforeEach(function () {
            engine = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
            scene = new Scene(engine);

            new ArcRotateCamera("Camera", 0, Math.PI / 2, 5, new Vector3(0, 0, 0), scene);
        });

        it("should return nothing if scene has no meshes", () => {
            const component = new OctreeSceneComponent(scene);
            const activeMeshes = component.getActiveMeshCandidates();

            expect(activeMeshes.length).toEqual(0);
        });

        it("should return all items when octree didn't created", () => {
            boxPositions.forEach((pos, i) => {
                MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene).position.set(pos[0], pos[1], pos[2]);
            });
            scene.render();

            const component = new OctreeSceneComponent(scene);
            const activeMeshes = component.getActiveMeshCandidates();

            expect(activeMeshes.length).toEqual(30);
        });

        it("should return part of all items by created octree with maxCapacity 4", () => {
            boxPositions.forEach((pos, i) => {
                MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene).position.set(pos[0], pos[1], pos[2]);
            });
            scene.render();

            const component = new OctreeSceneComponent(scene);
            scene.createOrUpdateSelectionOctree(4);

            const activeMeshes = component.getActiveMeshCandidates();

            expect(activeMeshes.length).toEqual(22);
            expect(activeMeshes.data.filter(Boolean).map((x) => x.id)).toEqual([
                "box_27",
                "box_2",
                "box_7",
                "box_12",
                "box_22",
                "box_9",
                "box_21",
                "box_1",
                "box_24",
                "box_0",
                "box_4",
                "box_20",
                "box_8",
                "box_26",
                "box_3",
                "box_5",
                "box_6",
                "box_23",
                "box_17",
                "box_11",
                "box_29",
                "box_14",
            ]);
        });

        it("should return part of all items by created octree with maxCapacity 6", () => {
            boxPositions.forEach((pos, i) => {
                MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene).position.set(pos[0], pos[1], pos[2]);
            });
            scene.render();

            const component = new OctreeSceneComponent(scene);
            scene.createOrUpdateSelectionOctree(6);

            const activeMeshes = component.getActiveMeshCandidates();

            expect(activeMeshes.length).toEqual(25);
            expect(activeMeshes.data.filter(Boolean).map((x) => x.id)).toEqual([
                "box_2",
                "box_7",
                "box_12",
                "box_22",
                "box_27",
                "box_9",
                "box_21",
                "box_1",
                "box_24",
                "box_0",
                "box_4",
                "box_20",
                "box_8",
                "box_26",
                "box_3",
                "box_5",
                "box_6",
                "box_23",
                "box_17",
                "box_11",
                "box_29",
                "box_14",
                "box_15",
                "box_16",
                "box_28",
            ]);
        });
    });
});
