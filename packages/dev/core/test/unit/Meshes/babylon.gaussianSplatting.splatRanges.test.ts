import { NullEngine } from "core/Engines/nullEngine";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Builds `count` splats (32 bytes each) with distinct positions so vertexCount is deterministic.
const createMultiSplatData = (count: number): ArrayBuffer => {
    const data = new ArrayBuffer(count * 32);
    const floats = new Float32Array(data);
    const bytes = new Uint8Array(data);
    for (let i = 0; i < count; i++) {
        const f = i * 8;
        floats[f + 0] = i;
        floats[f + 1] = i;
        floats[f + 2] = i;
        floats[f + 3] = 0.5;
        floats[f + 4] = 0.5;
        floats[f + 5] = 0.5;
        const b = i * 32;
        bytes[b + 24] = 255;
        bytes[b + 25] = 255;
        bytes[b + 26] = 255;
        bytes[b + 27] = 255;
        // Identity quaternion in the packed splat layout.
        bytes[b + 28] = 0;
        bytes[b + 29] = 128;
        bytes[b + 30] = 128;
        bytes[b + 31] = 128;
    }
    return data;
};

const pad16 = (value: number) => Math.max((value + 15) & ~0xf, 16);

describe("GaussianSplatting splat index ranges", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const createMesh = (splatCount: number) => {
        const mesh = new GaussianSplattingMesh("gs", null, scene);
        // Avoid spinning up the sort worker so behavior is synchronous and deterministic.
        mesh.disableDepthSort = true;
        mesh.updateData(createMultiSplatData(splatCount));
        return mesh;
    };

    it("renders the full source set with an identity index buffer when no range filter is active", () => {
        const mesh = createMesh(40);

        expect(mesh.renderedSplatCount).toBe(40);

        const splatIndex = (mesh as any)._splatIndex as Float32Array;
        expect(splatIndex.length).toBe(pad16(40));
        expect(Array.from(splatIndex.subarray(0, 40))).toEqual(Array.from({ length: 40 }, (_, i) => i));
    });

    it("restricts renderedSplatCount and buffer size to a single active range", () => {
        const mesh = createMesh(40);

        mesh.setSplatIndexRanges([{ offset: 0, count: 10 }]);

        expect(mesh.renderedSplatCount).toBe(10);
        expect((mesh as any)._splatIndex.length).toBe(pad16(10));
        expect(mesh.forcedInstanceCount).toBe(pad16(10) >> 4);
    });

    it("sums the counts of multiple active ranges", () => {
        const mesh = createMesh(40);

        mesh.setSplatIndexRanges([
            { offset: 0, count: 5 },
            { offset: 20, count: 7 },
        ]);

        expect(mesh.renderedSplatCount).toBe(12);
    });

    it("clamps ranges that extend past the source splat count", () => {
        const mesh = createMesh(40);

        mesh.setSplatIndexRanges([{ offset: 35, count: 100 }]);

        // Only splats [35, 40) exist.
        expect(mesh.renderedSplatCount).toBe(5);
    });

    it("renders nothing for an empty range list", () => {
        const mesh = createMesh(40);

        mesh.setSplatIndexRanges([]);

        expect(mesh.renderedSplatCount).toBe(0);
    });

    it("clears the range filter and renders the full set again when passed null", () => {
        const mesh = createMesh(40);

        mesh.setSplatIndexRanges([{ offset: 0, count: 10 }]);
        expect(mesh.renderedSplatCount).toBe(10);

        mesh.setSplatIndexRanges(null);
        expect(mesh.renderedSplatCount).toBe(40);
        expect((mesh as any)._splatIndex.length).toBe(pad16(40));
    });

    it("fills the full active range with valid source indices when growing (no hole on LOD refine)", () => {
        const mesh = createMesh(64);

        // Start on a small active set (a coarse LOD), then grow to a larger, non-contiguous active set
        // (refining one region to a finer LOD). The grown tail must never be left at the degenerate
        // padding index 0 — that produced the reported "hole" where the refined region rendered nothing.
        mesh.setSplatIndexRanges([{ offset: 0, count: 8 }]);
        mesh.setSplatIndexRanges([
            { offset: 0, count: 8 },
            { offset: 32, count: 16 },
        ]);

        expect(mesh.renderedSplatCount).toBe(24);

        const splatIndex = (mesh as any)._splatIndex as Float32Array;
        const active = new Set([...Array.from({ length: 8 }, (_, i) => i), ...Array.from({ length: 16 }, (_, i) => 32 + i)]);
        // Every rendered slot must reference a source splat inside the active ranges, even though the
        // asynchronous depth sort has not run (worker disabled): no slot may be a stale/degenerate value.
        for (let i = 0; i < 24; i++) {
            expect(active.has(splatIndex[i])).toBe(true);
        }
    });

    it("switches between different range sets without throwing", () => {
        const mesh = createMesh(40);

        expect(() => {
            mesh.setSplatIndexRanges([{ offset: 0, count: 8 }]);
            mesh.setSplatIndexRanges([{ offset: 10, count: 20 }]);
            mesh.setSplatIndexRanges([{ offset: 0, count: 40 }]);
            mesh.setSplatIndexRanges([{ offset: 5, count: 1 }]);
        }).not.toThrow();

        expect(mesh.renderedSplatCount).toBe(1);
    });
});
