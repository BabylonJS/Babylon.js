import { Engine } from "core/Engines/engine";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { describe, expect, it } from "vitest";

describe("engine.alphaToCoverage legacy entrypoints", () => {
    it("registers alpha-to-coverage for Engine", () => {
        expect(typeof Engine.prototype.setAlphaToCoverage).toBe("function");
        expect(typeof Engine.prototype.getAlphaToCoverage).toBe("function");
    });

    it("registers alpha-to-coverage for WebGPUEngine", () => {
        expect(typeof WebGPUEngine.prototype.setAlphaToCoverage).toBe("function");
        expect(typeof WebGPUEngine.prototype.getAlphaToCoverage).toBe("function");
    });
});
