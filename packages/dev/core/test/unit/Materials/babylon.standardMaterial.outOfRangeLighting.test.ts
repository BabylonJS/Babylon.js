import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { PreProcess } from "core/Engines/Processors/shaderProcessor";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from "core/Engines/shaderStore";
import { PointLight } from "core/Lights/pointLight";
import { StandardMaterial, type StandardMaterialDefines } from "core/Materials/standardMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";

// Side-effect imports register the lighting include and the includes it nests into ShaderStore.
import "core/Shaders/ShadersInclude/lightsFragmentFunctions";
import "core/Shaders/ShadersInclude/ltcHelperFunctions";
import "core/Shaders/ShadersInclude/clusteredLightingFunctions";
import "core/ShadersWGSL/ShadersInclude/lightsFragmentFunctions";
import "core/ShadersWGSL/ShadersInclude/ltcHelperFunctions";
import "core/ShadersWGSL/ShadersInclude/clusteredLightingFunctions";
import "core/ShadersWGSL/ShadersInclude/clusteredLightingCompute";
// StandardMaterial serialization depends on the ColorCurves side effect.
import "core/Materials/colorCurves";
// Pre-load shader modules that StandardMaterial dynamically imports during effect creation.
import "core/Shaders/default.fragment";
import "core/Shaders/default.vertex";

// The opt-in range test, and the unchanged in-range attenuation it guards.
const RangeTest = /dot\(direction,\s*direction\)\s*>=\s*range\s*\*\s*range/g;
const Attenuation = /attenuation\s*=\s*max\(0\.,\s*1\.0\s*-\s*length\(direction\)\s*\/\s*range\);/;
// computeLighting (point lights), computeIESSpotLighting and computeSpotLighting each get the test.
const LightFunctionsWithRange = 3;

const CountRangeTests = (code: string) => (code.match(RangeTest) ?? []).length;

describe("StandardMaterial out-of-range lighting skip", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // Runs Babylon's shader preprocessor (the stage that expands includes and resolves #if/#ifdef) over the given source.
    function preprocess(source: string, defines: string[], includesShadersStore: Record<string, string>, platformName: string): string {
        const options = {
            defines,
            indexParameters: { maxSimultaneousLights: 4 },
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
    ] as const)("%s lightsFragmentFunctions", (_language, getStore, platformName) => {
        const run = (defines: string[]) => preprocess("#include<lightsFragmentFunctions>", defines, getStore(), platformName);

        it("leaves the default shader without the range test", () => {
            const code = run([]);

            expect(CountRangeTests(code)).toBe(0);
            expect(code).toMatch(Attenuation);
        });

        it("adds the range test to point, spot and IES spot lighting when the material opts in", () => {
            const code = run(["#define SKIP_OUT_OF_RANGE_LIGHTING"]);

            expect(CountRangeTests(code)).toBe(LightFunctionsWithRange);
            expect(code).toMatch(Attenuation);
        });

        it("keeps the full path for NDOTL consumers such as CellMaterial", () => {
            const code = run(["#define SKIP_OUT_OF_RANGE_LIGHTING", "#define NDOTL"]);

            expect(CountRangeTests(code)).toBe(0);
        });
    });

    it("keeps the define off by default and follows the material property", () => {
        const mesh = CreateBox("box", {}, scene);
        const light = new PointLight("light", new Vector3(0, 2, 0), scene);
        light.range = 3;
        const material = new StandardMaterial("material", scene);
        mesh.material = material;
        const subMesh = mesh.subMeshes[0];

        material.isReadyForSubMesh(mesh, subMesh, false);
        expect(material.skipOutOfRangeLighting).toBe(false);
        expect((subMesh.materialDefines as StandardMaterialDefines).SKIP_OUT_OF_RANGE_LIGHTING).toBe(false);

        material.skipOutOfRangeLighting = true;
        material.isReadyForSubMesh(mesh, subMesh, false);
        expect((subMesh.materialDefines as StandardMaterialDefines).SKIP_OUT_OF_RANGE_LIGHTING).toBe(true);

        material.skipOutOfRangeLighting = false;
        material.isReadyForSubMesh(mesh, subMesh, false);
        expect((subMesh.materialDefines as StandardMaterialDefines).SKIP_OUT_OF_RANGE_LIGHTING).toBe(false);
    });

    it("round-trips the opt-in through serialization", () => {
        const material = new StandardMaterial("material", scene);
        material.skipOutOfRangeLighting = true;

        const parsed = StandardMaterial.Parse(material.serialize(), scene, "");

        expect(parsed.skipOutOfRangeLighting).toBe(true);
    });
});
