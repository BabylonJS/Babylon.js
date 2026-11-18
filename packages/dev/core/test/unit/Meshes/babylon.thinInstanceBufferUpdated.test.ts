import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Matrix } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import "core/Meshes/thinInstanceMesh";

describe("thinInstanceBufferUpdated", () => {
    let engine: NullEngine;
    let scene: Scene;
    let box: Mesh;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        box = MeshBuilder.CreateBox("box", {}, scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("should keep the matrix buffer in sync when synchronized while the count is 0", () => {
        const matrices = new Float32Array(16);
        Matrix.Translation(1, 2, 3).copyToArray(matrices);
        box.thinInstanceSetBuffer("matrix", matrices, 16, false);

        // Mirror what the engine receives so the test can check what the GPU would hold
        const gpu = new Float32Array(matrices);
        vi.spyOn(engine, "updateDynamicVertexBuffer").mockImplementation((_buffer, data, byteOffset = 0, byteLength) => {
            const src = data as Float32Array;
            const start = byteOffset / Float32Array.BYTES_PER_ELEMENT;
            const length = byteLength === undefined ? src.length : byteLength / Float32Array.BYTES_PER_ELEMENT;
            gpu.set(src.subarray(start, start + length), start);
        });

        // Hide, edit, synchronize, show
        box.thinInstanceCount = 0;
        Matrix.Translation(4, 5, 6).copyToArray(matrices);
        box.thinInstanceBufferUpdated("matrix");
        box.thinInstanceCount = 1;

        expect(Array.from(gpu)).toEqual(Array.from(matrices));
    });
});
