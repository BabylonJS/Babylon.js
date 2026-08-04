import { describe, it, expect } from "vitest";
import { ProcessIncludes } from "core/Engines/Processors/shaderProcessor";
import { ShaderStore } from "core/Engines/shaderStore";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";

// Side-effect imports register WGSL includes into ShaderStore.
import "core/ShadersWGSL/ShadersInclude/lightsFragmentFunctions";
import "core/ShadersWGSL/ShadersInclude/pbrDirectLightingFunctions";
import "core/ShadersWGSL/ShadersInclude/clusteredLightingCompute";
import "core/ShadersWGSL/ShadersInclude/pbrClusteredLightingFunctions";
import "core/ShadersWGSL/ShadersInclude/clusteredLightingFunctions";
import "core/ShadersWGSL/ShadersInclude/lightFragment";

/**
 * Firefox/Naga does not implement unrestricted_pointer_parameters.
 * Clustered lighting must not pass storage-buffer pointers as user-function parameters.
 */
describe("Clustered lighting WGSL pointer parameters", () => {
    function expandIncludes(source: string): Promise<string> {
        const options = {
            includesShadersStore: ShaderStore.IncludesShadersStoreWGSL,
            indexParameters: { maxSimultaneousLights: 4 },
            supportsUniformBuffers: true,
            isFragment: true,
            shouldUseHighPrecisionShader: true,
            processor: null,
            defines: [],
            shadersRepository: "",
            includesShadersRepository: "",
            version: "300 es",
            platformName: "WEBGL2",
            lookForClosingBracketForUniformBuffer: false,
        } as unknown as _IProcessingOptions;

        return new Promise((resolve) => {
            ProcessIncludes(source, options, (code) => resolve(code as string));
        });
    }

    it("specializes standard clustered lighting without storage pointer params", async () => {
        const code = await expandIncludes(`#include<lightsFragmentFunctions>
#include<lightFragment>[0..maxSimultaneousLights]`);

        expect(code).toContain("fn computeClusteredLighting0(");
        expect(code).toContain("tileMaskBuffer0[tileIndex]");
        expect(code).toContain("computeClusteredLighting0(");
        expect(code).not.toMatch(/fn\s+\w+\s*\([^)]*ptr\s*<\s*storage/s);
        expect(code).not.toContain("&tileMaskBuffer");
    });

    it("specializes PBR clustered lighting without storage pointer params", async () => {
        const code = await expandIncludes(`#include<pbrDirectLightingFunctions>
#include<lightFragment>[0..maxSimultaneousLights]`);

        expect(code).toContain("fn computeClusteredLighting0(");
        expect(code).toContain("tileMaskBuffer0[tileIndex]");
        expect(code).toContain("computeClusteredLighting0(");
        expect(code).not.toMatch(/fn\s+\w+\s*\([^)]*ptr\s*<\s*storage/s);
        expect(code).not.toContain("&tileMaskBuffer");
    });
});
