import { ArcRotateCamera } from "core/Cameras";
import type { Ray } from "core/Culling";
import { OctreeSceneComponent } from "core/Culling";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import type { AbstractMesh } from "core/Meshes";
import { MeshBuilder } from "core/Meshes";
import { SmartArrayNoDuplicate } from "core/Misc";
import { Scene } from "core/scene";

describe("OctreeBlock", function () {
    let engine: Engine;
    let scene: Scene;

    const boxPositions: [number, number, number][] = [
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

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);

        new ArcRotateCamera("Camera", 0, Math.PI / 2, 5, new Vector3(0, 0, 0), scene);

        boxPositions.forEach((pos, i) => {
            MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene).position.set(...pos);
        });
        scene.render();
    });

    describe("intersectsRay", () => {
        it("should set selection with block entries", () => {
            // Create octree
            const component = new OctreeSceneComponent(scene);
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithEntries = scene.selectionOctree.blocks[4];
            expect(blockWithEntries).toBeDefined();
            expect(blockWithEntries.entries.length).toEqual(1);

            // Call intersectsRay
            const ray = { intersectsBoxMinMax: (_min, _max) => true } as Ray;
            const rayIntersectsBoxMinMaxSpy = jest.spyOn(ray, "intersectsBoxMinMax");
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            blockWithEntries!.intersectsRay(ray, selection);

            // Ray intersects should be called once and with actual vectors
            expect(rayIntersectsBoxMinMaxSpy).toHaveBeenCalledTimes(1);
            expect(rayIntersectsBoxMinMaxSpy).toHaveBeenCalledWith(new Vector3(2, -9.5, -8.5), new Vector3(8.5, 0, 0));

            // Selection should contain the mesh from the block
            expect(selection.length).toEqual(1);
            expect(selection.data[0].name).toEqual("box_17");
        });
    });

    describe("createInnerBlocks", () => {
        it("should clean block when after subdivide", () => {
            // Create octree
            const component = new OctreeSceneComponent(scene);
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entries and save it count
            const blockWithEntries = scene.selectionOctree.blocks.find((b) => !!b.entries.length);
            const blockEntriesCount = blockWithEntries?.entries.length ?? 0;
            expect(blockWithEntries).toBeDefined();

            // After subdivide block should no contain direct entries
            blockWithEntries!.createInnerBlocks();
            expect(blockWithEntries!.entries.length).toEqual(0);

            // And sub blocks should have entries count equal to parent entries count
            const targetBlocksEntriesCount = blockWithEntries!.blocks.reduce((acc, b) => acc + b.entries.length, 0);
            expect(targetBlocksEntriesCount).toEqual(blockEntriesCount);
        });
    });
});
