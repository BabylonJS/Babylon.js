import { ArcRotateCamera } from "core/Cameras";
import type { Ray } from "core/Culling";
import "core/Culling/Octrees/octreeSceneComponent";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Plane, Vector3 } from "core/Maths";
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

        it('should save selection content after method call', () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Prepare stub of Ray and selection array
            const ray = { intersectsBoxMinMax: (_min, _max) => true } as Ray;
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);

            // After first call selection should contain only one mesh
            scene.selectionOctree.blocks[4]!.intersectsRay(ray, selection);
            expect(selection.length).toEqual(1);
            expect(selection.data.filter(Boolean).map(x => x.name)).toEqual(["box_17"]);

            // After second call selection should contain the previous selected mesh and more
            scene.selectionOctree.blocks[5]!.intersectsRay(ray, selection);
            expect(selection.length).toEqual(3);
            expect(selection.data.filter(Boolean).map(x => x.name)).toEqual(["box_17", "box_11", "box_29"]);
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

        it("should set selection array for block with sub-blocks and allow duplicates", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithSubBlocks = scene.selectionOctree.blocks[0];

            // Call intersects with a sphere
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            blockWithSubBlocks.intersects(new Vector3(0, 0, 0), 10, selection, true);

            // Selection should contain the mesh from the block
            expect(selection.length).toEqual(6);
            expect(selection.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_27", "box_2", "box_7", "box_12", "box_22"]);
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

        it('should save selection content after method call', () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Prepare selection array
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);

            // After first call selection should contain only one mesh
            scene.selectionOctree.blocks[4].intersects(new Vector3(0, 0, 0), 10, selection);
            expect(selection.length).toEqual(1);
            expect(selection.data.filter(Boolean).map(x => x.name)).toEqual(["box_17"]);

            // After second call selection should contain the previous selected mesh and more
            scene.selectionOctree.blocks[5].intersects(new Vector3(0, 0, 0), 10, selection);
            expect(selection.length).toEqual(3);
            expect(selection.data.filter(Boolean).map(x => x.name)).toEqual(["box_17", "box_11", "box_29"]);
        });
    });

    describe("removeEntry", () => {
        it("should remove entry from block", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithEntries = scene.selectionOctree.blocks[4];
            expect(blockWithEntries.entries.length).toEqual(1);

            // Call removeEntry
            blockWithEntries.removeEntry(blockWithEntries.entries[0]);

            // Block should not have any entries
            expect(blockWithEntries.entries.length).toEqual(0);
        });

        it("should remove entry from block with sub-blocks", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with sub-blocks
            const blockWithSubBlocks = scene.selectionOctree.blocks[0];
            expect(blockWithSubBlocks.entries.length).toEqual(0);
            expect(blockWithSubBlocks.blocks.length).toBeGreaterThan(1);

            // Call removeEntry
            blockWithSubBlocks.removeEntry(blockWithSubBlocks.blocks[0].entries[0]);

            // Block should not have any entries
            expect(blockWithSubBlocks.blocks[0].entries.length).toEqual(0);
        });

        it("should not remove entry that doesnt exist in the block", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Find first octree block with entry
            const blockWithEntries = scene.selectionOctree.blocks[4];
            expect(blockWithEntries.entries.length).toEqual(1);

            // Call removeEntry
            blockWithEntries.removeEntry({} as any);

            // Block should not have any entries
            expect(blockWithEntries.entries.length).toEqual(1);
        });
    });

    describe("select", () => {
        it("should select all meshes in frustum planes", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Call select with six frustum planes
            const frustumPlanesForAllBoxesInside: Plane[] = [
                // Left plane
                Plane.FromPositionAndNormal(new Vector3(-4.1, 0, 0), new Vector3(1, 0, 0)),
                // Right plane
                Plane.FromPositionAndNormal(new Vector3(8.1, 0, 0), new Vector3(-1, 0, 0)),
                // Top plane
                Plane.FromPositionAndNormal(new Vector3(0, 8.1, 0), new Vector3(0, -1, 0)),
                // Bottom plane
                Plane.FromPositionAndNormal(new Vector3(0, -9.1, 0), new Vector3(0, 1, 0)),
                // Near plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, -8.1), new Vector3(0, 0, 1)),
                // Far plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, 8.1), new Vector3(0, 0, -1)),
            ];

            // Selection should contain all presented entries
            const selection0 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[0].select(frustumPlanesForAllBoxesInside, selection0);
            expect(selection0.length).toEqual(5);
            expect(selection0.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_2", "box_7", "box_12", "box_22"]);

            const selection7 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[7].select(frustumPlanesForAllBoxesInside, selection7);
            expect(selection7.length).toEqual(5);
            expect(selection7.data.filter(Boolean).map((x) => x.name)).toEqual(["box_28", "box_11", "box_15", "box_14", "box_16"]);
        });

        it("should select only meshes that intersects with partial frustum planes (left side)", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Call select with six frustum planes
            const frustumPlanesForLeftPartOfBoxes: Plane[] = [
                // Left plane
                Plane.FromPositionAndNormal(new Vector3(-4.1, 0, 0), new Vector3(1, 0, 0)),
                // Right plane (zero because we check only left side)
                Plane.FromPositionAndNormal(new Vector3(0, 0, 0), new Vector3(-1, 0, 0)),
                // Top plane
                Plane.FromPositionAndNormal(new Vector3(0, 8.1, 0), new Vector3(0, -1, 0)),
                // Bottom plane
                Plane.FromPositionAndNormal(new Vector3(0, -9.1, 0), new Vector3(0, 1, 0)),
                // Near plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, -8.1), new Vector3(0, 0, 1)),
                // Far plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, 8.1), new Vector3(0, 0, -1)),
            ];

            // Selection should contain all presented entries
            const selection0 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[0].select(frustumPlanesForLeftPartOfBoxes, selection0);
            expect(selection0.length).toEqual(5);
            expect(selection0.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_2", "box_7", "box_12", "box_22"]);

            const selection7 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[7].select(frustumPlanesForLeftPartOfBoxes, selection7);
            expect(selection7.length).toEqual(0);
            expect(selection7.data.filter(Boolean).map((x) => x.name)).toEqual([]);
        });

        it("should select only meshes that intersects with partial frustum planes (top-right side)", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Call select with six frustum planes
            const frustumPlanesForAllBoxesInside: Plane[] = [
                // Left plane (zero because we check only top-right side)
                Plane.FromPositionAndNormal(new Vector3(0, 0, 0), new Vector3(1, 0, 0)),
                // Right plane
                Plane.FromPositionAndNormal(new Vector3(8.1, 0, 0), new Vector3(-1, 0, 0)),
                // Top plane
                Plane.FromPositionAndNormal(new Vector3(0, 8.1, 0), new Vector3(0, -1, 0)),
                // Bottom plane (zero because we check only top-right side)
                Plane.FromPositionAndNormal(new Vector3(0, 0, 0), new Vector3(0, 1, 0)),
                // Near plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, -8.1), new Vector3(0, 0, 1)),
                // Far plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, 8.1), new Vector3(0, 0, -1)),
            ];

            // Selection should contain all presented entries
            const selection0 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[0].select(frustumPlanesForAllBoxesInside, selection0);
            expect(selection0.length).toEqual(4);
            expect(selection0.data.filter(Boolean).map((x) => x.name)).toEqual(["box_2", "box_7", "box_12", "box_22"]);

            const selection7 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[7].select(frustumPlanesForAllBoxesInside, selection7);
            expect(selection7.length).toEqual(5);
            expect(selection7.data.filter(Boolean).map((x) => x.name)).toEqual(["box_28", "box_11", "box_15", "box_14", "box_16"]);
        });

        it("should select nothing if frustum planes are outside of octree", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Call select with six frustum planes
            const frustumPlanesOutOfBoxesScope: Plane[] = [
                // Left plane (x = 100, to be out of boxes scope)
                Plane.FromPositionAndNormal(new Vector3(100, 0, 0), new Vector3(1, 0, 0)),
                // Right plane (x = 101, to be out of boxes scope)
                Plane.FromPositionAndNormal(new Vector3(101, 0, 0), new Vector3(-1, 0, 0)),
                // Top plane
                Plane.FromPositionAndNormal(new Vector3(0, 8.1, 0), new Vector3(0, -1, 0)),
                // Bottom plane (zero because we check only top-right side)
                Plane.FromPositionAndNormal(new Vector3(0, 0, 0), new Vector3(0, 1, 0)),
                // Near plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, -8.1), new Vector3(0, 0, 1)),
                // Far plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, 8.1), new Vector3(0, 0, -1)),
            ];

            // Selection should contain all presented entries
            const selection0 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[0].select(frustumPlanesOutOfBoxesScope, selection0);
            expect(selection0.length).toEqual(0);
            expect(selection0.data.filter(Boolean).map((x) => x.name)).toEqual([]);

            const selection7 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[7].select(frustumPlanesOutOfBoxesScope, selection7);
            expect(selection7.length).toEqual(0);
            expect(selection7.data.filter(Boolean).map((x) => x.name)).toEqual([]);
        });

        it("should can select meshes with duplicates when it need", () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Call select with six frustum planes
            const frustumPlanesForAllBoxesInside: Plane[] = [
                // Left plane
                Plane.FromPositionAndNormal(new Vector3(-4.1, 0, 0), new Vector3(1, 0, 0)),
                // Right plane
                Plane.FromPositionAndNormal(new Vector3(8.1, 0, 0), new Vector3(-1, 0, 0)),
                // Top plane
                Plane.FromPositionAndNormal(new Vector3(0, 8.1, 0), new Vector3(0, -1, 0)),
                // Bottom plane
                Plane.FromPositionAndNormal(new Vector3(0, -9.1, 0), new Vector3(0, 1, 0)),
                // Near plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, -8.1), new Vector3(0, 0, 1)),
                // Far plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, 8.1), new Vector3(0, 0, -1)),
            ];

            // Selection should contain all presented entries
            const selection0 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[0].select(frustumPlanesForAllBoxesInside, selection0, true);
            expect(selection0.length).toEqual(6);
            expect(selection0.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_27", "box_2", "box_7", "box_12", "box_22"]);

            const selection7 = new SmartArrayNoDuplicate<AbstractMesh>(128);
            scene.selectionOctree.blocks[7].select(frustumPlanesForAllBoxesInside, selection7, true);
            expect(selection7.length).toEqual(7);
            expect(selection7.data.filter(Boolean).map((x) => x.name)).toEqual(["box_28", "box_28", "box_11", "box_15", "box_14", "box_15", "box_16"]);
        });

        it('should save selection content after method call', () => {
            // Create octree
            scene.createOrUpdateSelectionOctree(4);

            // Prepare selection array and six frustum planes
            const selection = new SmartArrayNoDuplicate<AbstractMesh>(128);
            const frustumPlanes: Plane[] = [
                // Left plane
                Plane.FromPositionAndNormal(new Vector3(-4.1, 0, 0), new Vector3(1, 0, 0)),
                // Right plane
                Plane.FromPositionAndNormal(new Vector3(8.1, 0, 0), new Vector3(-1, 0, 0)),
                // Top plane
                Plane.FromPositionAndNormal(new Vector3(0, 8.1, 0), new Vector3(0, -1, 0)),
                // Bottom plane
                Plane.FromPositionAndNormal(new Vector3(0, -9.1, 0), new Vector3(0, 1, 0)),
                // Near plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, -8.1), new Vector3(0, 0, 1)),
                // Far plane
                Plane.FromPositionAndNormal(new Vector3(0, 0, 8.1), new Vector3(0, 0, -1)),
            ];

            // Selection should contain all presented entries
            scene.selectionOctree.blocks[0].select(frustumPlanes, selection);
            expect(selection.length).toEqual(5);
            expect(selection.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_2", "box_7", "box_12", "box_22"]);

            scene.selectionOctree.blocks[7].select(frustumPlanes, selection);
            expect(selection.length).toEqual(10);
            expect(selection.data.filter(Boolean).map((x) => x.name)).toEqual(["box_27", "box_2", "box_7", "box_12", "box_22", "box_28", "box_11", "box_15", "box_14", "box_16"]);
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
