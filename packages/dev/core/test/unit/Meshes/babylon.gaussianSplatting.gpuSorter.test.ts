import { NullEngine } from "core/Engines/nullEngine";
import { type AbstractEngine } from "core/Engines/abstractEngine";
import { GaussianSplattingGpuSorter } from "core/Meshes/GaussianSplatting/gaussianSplattingGpuSorter";
import { describe, expect, it } from "vitest";

describe("GaussianSplattingGpuSorter.IsSupported", () => {
    it("returns false when the engine does not support compute shaders", () => {
        const engine = new NullEngine();
        expect(GaussianSplattingGpuSorter.IsSupported(engine)).toBe(false);
    });

    it("reflects the engine compute capability flag", () => {
        const makeEngine = (supportComputeShaders: boolean) => ({ getCaps: () => ({ supportComputeShaders }) }) as unknown as AbstractEngine;

        expect(GaussianSplattingGpuSorter.IsSupported(makeEngine(true))).toBe(true);
        expect(GaussianSplattingGpuSorter.IsSupported(makeEngine(false))).toBe(false);
    });
});
