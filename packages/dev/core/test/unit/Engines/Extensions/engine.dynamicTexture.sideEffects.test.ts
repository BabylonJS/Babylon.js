import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { describe, expect, it } from "vitest";

describe("engine.dynamicTexture legacy entrypoints", () => {
    it("registers dynamic textures for WebGPUEngine", () => {
        expect(typeof WebGPUEngine.prototype.createDynamicTexture).toBe("function");
        expect(typeof WebGPUEngine.prototype.updateDynamicTexture).toBe("function");
    });
});
