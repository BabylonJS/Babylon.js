import { describe, expect, it } from "vitest";

import { ShaderStore } from "core/Engines/shaderStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

import "core/Shaders/ShadersInclude/lightFragment";
import "core/Shaders/ShadersInclude/pbrClusteredLightingFunctions";
import "core/ShadersWGSL/ShadersInclude/lightFragment";
import "core/ShadersWGSL/ShadersInclude/pbrDirectLightingFunctions";

describe("HemisphericLight", () => {
    it("uses the light specular color for PBR specular lobes", () => {
        const glslLightFragment = ShaderStore.GetIncludesShadersStore()[`lightFragment`];
        const wgslLightFragment = ShaderStore.GetIncludesShadersStore(ShaderLanguage.WGSL)[`lightFragment`];
        const glslClusteredLightingFunctions = ShaderStore.GetIncludesShadersStore()[`pbrClusteredLightingFunctions`];
        const wgslDirectLightingFunctions = ShaderStore.GetIncludesShadersStore(ShaderLanguage.WGSL)[`pbrDirectLightingFunctions`];

        for (const lightFragment of [glslLightFragment, wgslLightFragment, glslClusteredLightingFunctions, wgslDirectLightingFunctions]) {
            // Specular lobe must now use vLightSpecular.rgb
            expect(lightFragment).toMatch(/computeSpecularLighting\([^)]*vLightSpecular\.rgb\)/);
            // Sheen must keep using the diffuse light color (sheen is diffuse-like)
            expect(lightFragment).not.toMatch(/computeSheenLighting\([^)]*vLightSpecular\.rgb\)/);
            expect(lightFragment).not.toContain("computeSpecularLighting(preInfo,normalW,clearcoatOut.specularEnvironmentR0,coloredFresnel,AARoughnessFactors.x,diffuse{X}.rgb)");
            expect(lightFragment).not.toContain(
                "computeSpecularLighting(preInfo, normalW, clearcoatOut.specularEnvironmentR0, coloredFresnel, AARoughnessFactors.x, diffuse{X}.rgb)"
            );
            expect(lightFragment).not.toContain("computeSpecularLighting(preInfo,N,specularEnvironmentR0,coloredFresnel,AARoughnessFactor,light.vLightDiffuse.rgb)");
            expect(lightFragment).not.toContain("computeSpecularLighting(preInfo, N, specularEnvironmentR0, coloredFresnel, AARoughnessFactor, light.vLightDiffuse.rgb)");
        }
    });
});
