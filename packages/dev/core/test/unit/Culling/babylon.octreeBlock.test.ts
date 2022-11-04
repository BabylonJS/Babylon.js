import { ArcRotateCamera } from "core/Cameras";
import type { Ray } from "core/Culling";
import "core/Culling/Octrees/octreeSceneComponent";
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

        it("should set selection with sub-blocks", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Get first octree block with sub-blocks
            const blockWithSubBlocks = scene.selectionOctree.blocks[0];
            expect(blockWithSubBlocks).toBeDefined();
            expect(blockWithSubBlocks.blocks.length).toEqual(8);

            // When block has sub-blocks, it should not have eny entries
            expect(blockWithSubBlocks.entries.length).toEqual(0);

            // Call intersectsRay
            const ray = { intersectsBoxMinMax: (_min, _max) => true } as Ray;
            const rayIntersectsBoxMinMaxSpy = jest.spyOn(ray, "intersectsBoxMinMax");
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            blockWithSubBlocks!.intersectsRay(ray, selection);

            // Ray intersects should be called once and 8 times in the recursion (for every sub-block)
            expect(rayIntersectsBoxMinMaxSpy).toHaveBeenCalledTimes(9);

            // Selection should contain the meshes from the sub-blocks
            expect(selection.length).toEqual(5);
            expect(selection.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_2", "box_7", "box_12", "box_22"]);
        });

        it("should not set selection when ray does not intersect", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithEntries = scene.selectionOctree.blocks[4];

            // Call intersectsRay
            const ray = { intersectsBoxMinMax: (_min, _max) => false } as Ray;
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            blockWithEntries.intersectsRay(ray, selection);

            // Selection should be empty because ray does not intersect
            expect(selection.length).toEqual(0);
        });
    });

    describe("intersects", () => {
        it("should set selection array", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithEntries = scene.selectionOctree.blocks[4];

            // Call intersects with a sphere
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            blockWithEntries.intersects(new Vector3(0, 0, 0), 10, selection);

            // Selection should contain the mesh from the block
            expect(selection.length).toEqual(1);
            expect(selection.data[0].name).toEqual("box_17");
        });

        it("should set selection array for block with sub-blocks", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithSubBlocks = scene.selectionOctree.blocks[0];

            // Call intersects with a sphere
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            blockWithSubBlocks.intersects(new Vector3(0, 0, 0), 10, selection);

            // Selection should contain the mesh from the block
            expect(selection.length).toEqual(5);
            expect(selection.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_2", "box_7", "box_12", "box_22"]);
        });

        it("should not set selection array when sphere does not intersect", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithEntries = scene.selectionOctree.blocks[4];

            // Call intersects with a sphere
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            blockWithEntries.intersects(new Vector3(0, 0, 0), 0.1, selection);

            // Selection should be empty because sphere does not intersect
            expect(selection.length).toEqual(0);
        });
    });

    describe("createInnerBlocks", () => {
        it("should clean block when after subdivide", () => {
            // Create octree
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
