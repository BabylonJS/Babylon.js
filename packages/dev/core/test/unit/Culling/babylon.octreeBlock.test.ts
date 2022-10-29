import { ArcRotateCamera } from "core/Cameras";
import { OctreeSceneComponent } from "core/Culling";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { MeshBuilder } from "core/Meshes";
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
    });

    describe("createInnerBlocks", () => {
        it("should clean block when after subdivide", () => {
            boxPositions.forEach((pos, i) => {
                MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene).position.set(...pos);
            });
            scene.render();

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
