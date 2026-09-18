import { NullEngine } from "core/Engines/nullEngine";
import { PreProcess } from "core/Engines/Processors/shaderProcessor";
import type { _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { GaussianSplattingMaterial, GetPartIndexVaryingDeclaration } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingSolidColorMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingSolidColorMaterialPlugin";
import { GaussianSplattingGpuPickingMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingGpuPickingMaterialPlugin";
import { GaussianSplattingDebugMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingDebugMaterialPlugin";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Regression coverage for the WGSL "redefinition of 'vPartIndex'" error: more than one Gaussian
// Splatting material plugin (solid-color, GPU picking, debug) can be attached to the same material,
// and each needs the `vPartIndex` varying. They must share a single include-guarded declaration so
// the combined shader declares it exactly once — otherwise WGSL fails to compile and splats vanish.
describe("GaussianSplatting vPartIndex varying sharing", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: GaussianSplattingMaterial;

    beforeEach(() => {
        engine = new NullEngine({ renderWidth: 256, renderHeight: 256, textureSize: 256 });
        scene = new Scene(engine);
        material = new GaussianSplattingMaterial("material", scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // Runs Babylon's shader preprocessor (the stage that resolves #if/#ifndef/#define) over the
    // given definitions and returns the resulting source.
    function preprocess(source: string, defines: string[] = []): string {
        const options = {
            defines,
            indexParameters: undefined,
            isFragment: false,
            shouldUseHighPrecisionShader: true,
            supportsUniformBuffers: true,
            shadersRepository: "",
            includesShadersStore: {},
            processor: null,
            version: "300",
            platformName: "WEBGL2",
            processingContext: null,
            isNDCHalfZRange: false,
            useReverseDepthBuffer: false,
        } as unknown as _IProcessingOptions;
        let out = "";
        PreProcess(source, options, (code) => (out = code), engine);
        return out;
    }

    const countVarying = (code: string) => (code.match(/varying\s+(?:float\s+)?vPartIndex/g) ?? []).length;

    it("emits an include-guarded declaration for each shader language", () => {
        const wgsl = GetPartIndexVaryingDeclaration(ShaderLanguage.WGSL);
        expect(wgsl).toContain("#if !defined(VPARTINDEX_VARYING_DECLARED)");
        expect(wgsl).toContain("#define VPARTINDEX_VARYING_DECLARED");
        expect(wgsl).toContain("varying vPartIndex: f32;");

        const glsl = GetPartIndexVaryingDeclaration(ShaderLanguage.GLSL);
        expect(glsl).toContain("#if !defined(VPARTINDEX_VARYING_DECLARED)");
        expect(glsl).toContain("varying float vPartIndex;");
    });

    it("collapses two guarded declarations to a single declaration after preprocessing", () => {
        const decl = GetPartIndexVaryingDeclaration(ShaderLanguage.WGSL);
        expect(countVarying(preprocess(decl + "\n" + decl))).toBe(1);
    });

    it("would leave two declarations without the guard (test is sensitive to the regression)", () => {
        const unguarded = "varying vPartIndex: f32;";
        expect(countVarying(preprocess(unguarded + "\n" + unguarded))).toBe(2);
    });

    it.each([ShaderLanguage.WGSL, ShaderLanguage.GLSL])("declares vPartIndex once when solid-color and GPU-picking plugins are combined (%s)", (language) => {
        const solidColor = new GaussianSplattingSolidColorMaterialPlugin(material, [], 4);
        const gpuPicking = new GaussianSplattingGpuPickingMaterialPlugin(material, 4);

        for (const shaderType of ["vertex", "fragment"] as const) {
            const key = shaderType === "vertex" ? "CUSTOM_VERTEX_DEFINITIONS" : "CUSTOM_FRAGMENT_DEFINITIONS";
            const combined = (solidColor.getCustomCode(shaderType, language)![key] ?? "") + "\n" + (gpuPicking.getCustomCode(shaderType, language)![key] ?? "");
            expect(countVarying(preprocess(combined)), `${shaderType} (${language})`).toBe(1);
        }
    });

    it("routes the debug plugin's declaration through the shared guard", () => {
        const debug = new GaussianSplattingDebugMaterialPlugin(material);
        for (const language of [ShaderLanguage.WGSL, ShaderLanguage.GLSL]) {
            for (const shaderType of ["vertex", "fragment"] as const) {
                const key = shaderType === "vertex" ? "CUSTOM_VERTEX_DEFINITIONS" : "CUSTOM_FRAGMENT_DEFINITIONS";
                expect(debug.getCustomCode(shaderType, language)![key]).toContain("VPARTINDEX_VARYING_DECLARED");
            }
        }
    });
});
