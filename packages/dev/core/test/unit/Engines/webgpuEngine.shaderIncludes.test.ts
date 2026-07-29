import { describe, expect, it } from "vitest";

import { ShaderStore } from "core/Engines/shaderStore";
import "core/Engines/webgpuEngine";

describe("WebGPUEngine shader includes", () => {
    it.each(["sceneUboDeclaration", "meshUboDeclaration", "instancesDeclaration", "instancesVertex"])("registers the %s WGSL include", (includeName) => {
        expect(ShaderStore.IncludesShadersStoreWGSL[includeName]).toBeDefined();
    });
});
