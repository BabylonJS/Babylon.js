import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { PreProcess } from "core/Engines/Processors/shaderProcessor";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from "core/Engines/shaderStore";

// Side-effect imports register the PBR includes in ShaderStore.
import "core/Shaders/ShadersInclude/pbrIBLFunctions";
import "core/Shaders/ShadersInclude/pbrBlockGeometryInfo";
import "core/Shaders/ShadersInclude/pbrBlockFinalLitComponents";
import "core/ShadersWGSL/ShadersInclude/pbrIBLFunctions";
import "core/ShadersWGSL/ShadersInclude/pbrBlockGeometryInfo";
import "core/ShadersWGSL/ShadersInclude/pbrBlockFinalLitComponents";

type Overlap = (cosAxes: number, spread: number, reflectionSpread: number) => number;
type Occlusion = (cosBentNormal: number, cosBentReflection: number, cosNormalReflection: number, NdotV: number, ambientOcclusion: number, alphaG: number) => number;
type Vec3 = [number, number, number];

// Matches convertRoughnessToAverageSlope: alphaG = roughness^2 + MINIMUMVARIANCE.
const AlphaG = (roughness: number) => roughness * roughness + 0.0005;
const Dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FromAngle = (degrees: number): Vec3 => [Math.sin((degrees * Math.PI) / 180), 0, Math.cos((degrees * Math.PI) / 180)];
const Normal: Vec3 = [0, 0, 1];

// Integrates exp((dot(axis, w) - 1) / spread + (dot(z, w) - 1) / reflectionSpread) over the sphere, divided by 2 * PI * reflectionSpread.
function IntegrateOverlap(cosAxes: number, spread: number, reflectionSpread: number): number {
    const axis: Vec3 = [Math.sqrt(1 - cosAxes * cosAxes), 0, cosAxes];
    const thetaSteps = 1200;
    const phiSteps = 240;
    let sum = 0;
    for (let i = 0; i < thetaSteps; i++) {
        const cosTheta = -1 + (2 * (i + 0.5)) / thetaSteps;
        const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
        for (let j = 0; j < phiSteps; j++) {
            const phi = (2 * Math.PI * (j + 0.5)) / phiSteps;
            const direction: Vec3 = [sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), cosTheta];
            sum += Math.exp((Dot(axis, direction) - 1) / spread + (cosTheta - 1) / reflectionSpread);
        }
    }
    return (sum * (2 / thetaSteps) * ((2 * Math.PI) / phiSteps)) / (2 * Math.PI * reflectionSpread);
}

describe("PBR bent normal specular occlusion", () => {
    let engine: Engine;

    beforeAll(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    afterAll(() => {
        engine.dispose();
    });

    // Runs Babylon's shader preprocessor (the stage that expands includes and resolves #if/#ifdef) over the given source.
    function preprocess(source: string, defines: string[], includesShadersStore: Record<string, string>, platformName: string): string {
        const options = {
            defines,
            indexParameters: {},
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

    // Translates a scalar shader function from the shipped include into JavaScript so its math can be evaluated directly.
    function extractFunction(code: string, name: string): { parameters: string; body: string } {
        const header = new RegExp(`(?:float|fn)\\s+${name}\\s*\\(([^)]*)\\)[^{]*\\{`).exec(code);
        expect(header).not.toBeNull();
        let depth = 1;
        let index = header!.index + header![0].length;
        const start = index;
        while (depth > 0) {
            depth += code[index] === "{" ? 1 : code[index] === "}" ? -1 : 0;
            index++;
        }
        const parameters = header![1]
            .split(",")
            .map((parameter) =>
                parameter
                    .trim()
                    .replace(/^float\s+/, "")
                    .replace(/\s*:\s*f32$/, "")
            )
            .join(", ");
        const body = code
            .substring(start, index - 1)
            .replace(/\bfloat\s+(\w+)\s*=/g, "let $1 =")
            .replace(/\b(?:let|var)\s+(\w+)\s*:\s*f32\s*=/g, "let $1 =");
        return { parameters, body };
    }

    function compile(code: string): { overlap: Overlap; overlapFromDistance: Overlap; occlusion: Occlusion } {
        const helpers = {
            clamp: (x: number, low: number, high: number) => Math.min(high, Math.max(low, x)),
            saturate: (x: number) => Math.min(1, Math.max(0, x)),
            sqrt: Math.sqrt,
            exp: Math.exp,
            max: Math.max,
            min: Math.min,
        };
        const build = (name: string, scope: Record<string, unknown>) => {
            const { parameters, body } = extractFunction(code, name);
            return new Function(...Object.keys(scope), `return function (${parameters}) {${body}};`)(...Object.values(scope));
        };
        const overlapFromDistance = build("bentNormalSGOverlap", helpers) as Overlap;
        const overlap: Overlap = (cosAxes, spread, reflectionSpread) => overlapFromDistance(2 * (1 - helpers.clamp(cosAxes, -1, 1)), spread, reflectionSpread);
        const occlusionFromDistances = build("bentNormalSGOcclusion", { ...helpers, bentNormalSGOverlap: overlapFromDistance }) as (
            bentDistanceSquared: number,
            normalDistanceSquared: number,
            NdotV: number,
            ambientOcclusion: number,
            alphaG: number
        ) => number;
        const occlusion: Occlusion = (cosBentNormal, cosBentReflection, cosNormalReflection, NdotV, ambientOcclusion, alphaG) => {
            const visibility = helpers.saturate(ambientOcclusion);
            if (visibility === 0 || visibility === 1) {
                return visibility;
            }
            let cosAxisReflection = cosBentReflection;
            if (cosBentNormal < Math.sqrt(visibility)) {
                const tangentLength = Math.sqrt(Math.max(0, 1 - cosBentNormal * cosBentNormal));
                cosAxisReflection =
                    tangentLength > 1e-6
                        ? Math.sqrt(visibility) * cosNormalReflection +
                          Math.sqrt(1 - visibility) * helpers.clamp((cosBentReflection - cosBentNormal * cosNormalReflection) / tangentLength, -1, 1)
                        : cosNormalReflection;
            }
            return occlusionFromDistances(2 * (1 - cosAxisReflection), 2 * (1 - cosNormalReflection), NdotV, visibility, alphaG);
        };
        return { overlap, overlapFromDistance, occlusion };
    }

    describe.each([
        ["GLSL", () => ShaderStore.IncludesShadersStore, "WEBGL2"],
        ["WGSL", () => ShaderStore.IncludesShadersStoreWGSL, "WEBGPU"],
    ] as const)("%s", (_language, getStore, platformName) => {
        const ibl = () => preprocess("#include<pbrIBLFunctions>", ["#define BENTNORMAL", "#define REFLECTION"], getStore(), platformName);
        const finalLit = (defines: string[]) =>
            preprocess("#include<pbrBlockGeometryInfo>\n#include<pbrBlockFinalLitComponents>", ["#define BENTNORMAL", "#define REFLECTION", ...defines], getStore(), platformName);

        // Evaluates the shipped vector wrapper's scalar arguments for unit vectors.
        const occlusionFor = (occlusion: Occlusion, bent: Vec3, reflection: Vec3, NdotV: number, ambientOcclusion: number, alphaG: number) =>
            occlusion(Dot(bent, Normal), Dot(bent, reflection), Dot(Normal, reflection), NdotV, ambientOcclusion, alphaG);

        it("only emits the helper when bent normals and reflections are active", () => {
            expect(preprocess("#include<pbrIBLFunctions>", ["#define BENTNORMAL"], getStore(), platformName)).not.toContain("bentNormalSGOcclusion");
            const code = ibl();
            expect(code).toMatch(/bentNormalSGOcclusion\(dot\(bentDelta,\s*bentDelta\),\s*dot\(normalDelta,\s*normalDelta\),\s*NdotV,\s*visibility,\s*alphaG\)/);
            expect(code).toMatch(/bentDelta(?::\s*vec3f)?\s*=\s*axis\s*-\s*reflectionDirection/);
        });

        it("matches the defining spherical integral of the SG product", () => {
            const { overlap } = compile(ibl());
            for (const [cosAxes, spread, reflectionSpread] of [
                [1, 0.5, 0.5],
                [0.3, 0.4, 0.8],
                [-1, 0.7, 0.7],
                [-0.99, 0.6, 0.6],
                [0.8, 1, 2],
                [0, 1, 0.3],
            ]) {
                expect(overlap(cosAxes, spread, reflectionSpread)).toBeCloseTo(IntegrateOverlap(cosAxes, spread, reflectionSpread), 5);
            }
        });

        it("preserves float32-sized angular separation for narrow mirror lobes", () => {
            const { overlapFromDistance } = compile(ibl());
            const distanceSquared = Math.fround(1e-8);
            const spread = Math.fround(5e-9);
            // Converting this distance to a float32 cosine first would round to 1 and lose the attenuation.
            expect(Math.fround(1 - distanceSquared / 2)).toBe(1);
            expect(overlapFromDistance(distanceSquared, spread, 0)).toBeCloseTo(Math.exp(-1), 6);
            expect(overlapFromDistance(0, spread, 0)).toBe(1);
        });

        it("returns full visibility for open AO at every roughness, view angle and bent direction", () => {
            const { occlusion } = compile(ibl());
            const reflection = FromAngle(30);
            for (const alphaG of [0, AlphaG(0), AlphaG(0.1), AlphaG(0.5), AlphaG(1), 2.5]) {
                for (const NdotV of [1, 0.5, 0.05, 0, -0.3]) {
                    for (const bentAngle of [0, 20, 45, 90, 180]) {
                        expect(occlusionFor(occlusion, FromAngle(bentAngle), reflection, NdotV, 1, alphaG)).toBe(1);
                    }
                    expect(occlusionFor(occlusion, Normal, Normal, NdotV, 1, alphaG)).toBe(1);
                }
            }
        });

        it("returns zero for closed AO, including mirror and aligned lobes", () => {
            const { occlusion } = compile(ibl());
            for (const alphaG of [0, AlphaG(0), AlphaG(0.1), AlphaG(1)]) {
                for (const NdotV of [1, 0.2, 0, -1]) {
                    expect(occlusionFor(occlusion, Normal, Normal, NdotV, 0, alphaG)).toBe(0);
                    expect(occlusionFor(occlusion, FromAngle(20), FromAngle(20), NdotV, 0, alphaG)).toBe(0);
                }
            }
        });

        it("converges continuously to zero as AO closes on glossy surfaces", () => {
            const { occlusion } = compile(ibl());
            const alphaG = AlphaG(0.1);
            const aligned = (ambientOcclusion: number) => occlusionFor(occlusion, Normal, Normal, 1, ambientOcclusion, alphaG);

            expect(aligned(1e-3)).toBeGreaterThan(aligned(0));
            expect(aligned(1e-3)).toBeLessThan(0.75);
            expect(aligned(1e-5)).toBeLessThan(0.05);
            expect(aligned(1e-8)).toBeLessThan(1e-4);
            // With the cone and lobe both on the normal, the visible overlap is visibilitySpread / (visibilitySpread + reflectionSpread)
            // and the open hemisphere overlap is 1 / (1 + reflectionSpread).
            const visibilitySpread = 1e-3 / (1 + Math.sqrt(1 - 1e-3));
            const reflectionSpread = 2 * alphaG * alphaG;
            expect(aligned(1e-3)).toBeCloseTo((visibilitySpread * (1 + reflectionSpread)) / (visibilitySpread + reflectionSpread), 6);
        });

        it("increases monotonically with AO and stays finite in [0, 1]", () => {
            const { occlusion } = compile(ibl());
            for (const alphaG of [0, AlphaG(0), AlphaG(0.1), AlphaG(0.5), AlphaG(1), 2]) {
                for (const NdotV of [1, 0.4, 0, -0.5]) {
                    for (const [bentAngle, reflectionAngle] of [
                        [0, 0],
                        [25, -40],
                        [90, 60],
                        [180, 0],
                        [-60, 60],
                    ]) {
                        let previous = 0;
                        for (let step = 0; step <= 100; step++) {
                            const value = occlusionFor(occlusion, FromAngle(bentAngle), FromAngle(reflectionAngle), NdotV, step / 100, alphaG);
                            expect(Number.isFinite(value)).toBe(true);
                            expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
                            expect(value).toBeLessThanOrEqual(1);
                            previous = value;
                        }
                    }
                }
            }
        });

        it("stays finite for cancelling axes and extreme spreads", () => {
            const { overlap, occlusion } = compile(ibl());
            for (const [cosAxes, spread, reflectionSpread] of [
                [-1, 0, 0],
                [-1, 1e-12, 1e-12],
                [-1, 0.5, 0.5],
                [1, 0, 0],
                [1, 1e-20, 0],
                [0, 0, 1e-20],
                [1.5, 1, 0],
                [-1.5, 1, 8],
            ]) {
                const value = overlap(cosAxes, spread, reflectionSpread);
                expect(Number.isFinite(value)).toBe(true);
                expect(value).toBeGreaterThanOrEqual(0);
            }
            expect(occlusion(1, -1, -1, 1, 0.1, AlphaG(0))).toBeLessThan(1e-6);
            expect(occlusion(-1, 1, -1, 0, 0, 0)).toBe(0);
        });

        it("samples visibility along the mirror direction for mirror reflections", () => {
            const { occlusion } = compile(ibl());
            const bent = FromAngle(20);
            // The cosine-weighted cone for AO 0.25 has a 30 degree half-angle, so a 20 degree tilt is realizable.
            expect(occlusionFor(occlusion, bent, bent, 1, 0.25, 0)).toBeCloseTo(1, 6);
            expect(occlusionFor(occlusion, bent, FromAngle(-90), 1, 0.25, 0)).toBeLessThan(1e-3);
            expect(occlusionFor(occlusion, bent, FromAngle(10), 1, 0.25, 0)).toBeGreaterThan(occlusionFor(occlusion, bent, FromAngle(-10), 1, 0.25, 0));
        });

        it.each([
            ["without", [] as string[], false],
            ["with", ["#define SPECULARAA"], true],
        ] as const)("passes the effective alphaG %s specular antialiasing to the occlusion", (_name, defines, broadened) => {
            const code = finalLit([...defines]);
            const call = code.search(/environmentBentNormalOcclusion\(bentNormalW,\s*reflectedDirection,\s*normalW,\s*NdotVUnclamped,\s*bentAO,\s*alphaG\)/);
            const assignments = [...code.substring(0, call).matchAll(/\balphaG\s*(?::\s*f32\s*)?([-+*/]?=)\s*([^;]*);/g)].map((match) => match[1] + match[2]);

            expect(call).toBeGreaterThanOrEqual(0);
            expect(assignments[0]).toBe("=convertRoughnessToAverageSlope(roughness)");
            // The SG lobe consumes the same alphaG as reflection sampling, including the antialiasing broadening.
            expect(assignments.slice(1)).toEqual(broadened ? ["+=AARoughnessFactors.y"] : []);
            expect(code).not.toMatch(/environmentBentNormalOcclusion\([^)]*roughness\)/);
        });

        it("keeps the anisotropic reflection direction for the occlusion", () => {
            expect(finalLit(["#define ANISOTROPIC"])).toMatch(/reflectedDirection(?::\s*vec3f)?\s*=\s*reflect\(-viewDirectionW,\s*anisotropicOut\.anisotropicNormal\)/);
            expect(finalLit([])).toMatch(/reflectedDirection(?::\s*vec3f)?\s*=\s*reflect\(-viewDirectionW,\s*normalW\)/);
        });
    });
});
