import { describe, it, expect } from "vitest";
import { PrepareUniformsAndSamplersForLight } from "core/Materials/materialHelper.functions";

describe("PrepareUniformsAndSamplersForLight", () => {
    it("keeps clustered light tile masks as textures by default", () => {
        const uniforms: string[] = [];
        const samplers: string[] = [];

        PrepareUniformsAndSamplersForLight(0, uniforms, samplers, false, null, false, false, true);

        expect(samplers).toContain("lightDataTexture0");
        expect(samplers).toContain("tileMaskTexture0");
    });

    it("does not add a clustered light tile mask texture when using a storage buffer", () => {
        const uniforms: string[] = [];
        const samplers: string[] = [];

        PrepareUniformsAndSamplersForLight(0, uniforms, samplers, false, null, false, false, true, false, true);

        expect(samplers).toContain("lightDataTexture0");
        expect(samplers).not.toContain("tileMaskTexture0");
    });
});
