import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { PreProcess } from "core/Engines/Processors/shaderProcessor";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from "core/Engines/shaderStore";

// Side-effect imports register the StandardMaterial shaders and includes into ShaderStore.
import "core/Shaders/default.fragment";
import "core/ShadersWGSL/default.fragment";

const AreaLighting = /info\s*=\s*computeAreaLighting\(/;

describe("StandardMaterial WGSL shader matches GLSL", () => {
    let engine: Engine;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    afterEach(() => {
        engine.dispose();
    });

    function preprocess(source: string, defines: string[], includesShadersStore: Record<string, string>, platformName: string): string {
        const options = {
            defines: defines.map((define) => `#define ${define}`),
            indexParameters: { maxSimultaneousLights: 1 },
            isFragment: true,
            shouldUseHighPrecisionShader: true,
            supportsUniformBuffers: true,
            shadersRepository: "",
            includesShadersStore,
            processor: null,
            version: "300",
            platformName,
            processingContext: null,
            isNDCHalfZRange: false,
            useReverseDepthBuffer: false,
        } as unknown as _IProcessingOptions;
        let out = "";
        PreProcess(source, options, (code) => (out = code), engine);
        return out;
    }

    describe.each([
        ["GLSL", () => ShaderStore.IncludesShadersStore, "WEBGL2"],
        ["WGSL", () => ShaderStore.IncludesShadersStoreWGSL, "WEBGPU"],
    ] as const)("%s lightFragment area light branch", (_language, getStore, platformName) => {
        const run = (defines: string[]) => preprocess("#include<lightFragment>[0..maxSimultaneousLights]", defines, getStore(), platformName);

        it("computes area lighting for an area light", () => {
            expect(run(["LIGHT0", "AREALIGHT0", "AREALIGHTUSED", "AREALIGHTSUPPORTED"])).toMatch(AreaLighting);
        });

        it("skips area lighting without AREALIGHTUSED", () => {
            expect(run(["LIGHT0", "AREALIGHT0", "AREALIGHTSUPPORTED"])).not.toMatch(AreaLighting);
        });
    });

    describe("WGSL reflection and refraction fresnel", () => {
        // The preprocessor strips whitespace, so the expected expressions are written without spaces.
        const run = (defines: string[]) =>
            preprocess(
                ShaderStore.ShadersStoreWGSL["defaultPixelShader"],
                ["REFLECTION", "REFLECTIONMAP_CUBIC", "FRESNEL", ...defines],
                ShaderStore.IncludesShadersStoreWGSL,
                "WEBGPU"
            );

        it("scales the whole left/right blend of the reflection color", () => {
            expect(run(["REFLECTIONFRESNEL"])).toContain(
                "reflectionColor.rgb*(uniforms.reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*uniforms.reflectionRightColor.rgb)"
            );
        });

        it("scales the whole blend when the fresnel comes from the specular color", () => {
            expect(run(["REFLECTIONFRESNEL", "REFLECTIONFRESNELFROMSPECULAR", "SPECULARTERM"])).toContain(
                "reflectionColor.rgb*(specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*uniforms.reflectionRightColor.rgb)"
            );
        });

        it("scales the whole left/right blend of the refraction color", () => {
            expect(run(["REFRACTION", "REFRACTIONFRESNEL"])).toContain(
                "refractionColor.rgb*(uniforms.refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*uniforms.refractionRightColor.rgb)"
            );
        });
    });
});
