import { describe, expect, it } from "vitest";

import { ShaderStore } from "core/Engines/shaderStore";

// Regression coverage for the tree-shaking split dropping the WGSL depth shader
// registration. Importing the public DepthRenderer entry point must register the depth
// shaders for BOTH shader languages so WebGPU depth rendering works. Before the fix only
// the GLSL depth shaders were statically imported, so under WebGPU the WGSL depth shaders
// 404'd and the depth buffer rendered black.
import "core/Rendering/depthRenderer";

describe("DepthRenderer shader registration", () => {
    it("registers the GLSL depth shaders", () => {
        expect(ShaderStore.ShadersStore["depthVertexShader"]).toBeDefined();
        expect(ShaderStore.ShadersStore["depthPixelShader"]).toBeDefined();
    });

    it("registers the WGSL depth shaders", () => {
        expect(ShaderStore.ShadersStoreWGSL["depthVertexShader"]).toBeDefined();
        expect(ShaderStore.ShadersStoreWGSL["depthPixelShader"]).toBeDefined();
    });
});
