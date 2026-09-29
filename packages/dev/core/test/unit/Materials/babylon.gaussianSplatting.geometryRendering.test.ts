import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Matrix } from "core/Maths/math.vector";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
import { type GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type Effect } from "core/Materials/effect";
import "core/Engines/AbstractEngine/abstractEngine.renderPass";

const coreSourceDirectory = fileURLToPath(new URL("../../../src/", import.meta.url));

function readSource(relativePath: string): string {
    return readFileSync(join(coreSourceDirectory, relativePath), "utf8");
}

describe("Gaussian splatting geometry rendering shaders", () => {
    const shaderLanguages = [
        { name: "GLSL", directory: "Shaders/" },
        { name: "WGSL", directory: "ShadersWGSL/" },
    ];

    it.each(shaderLanguages)("$name emits geometry outputs after material plugin color injection", ({ directory }) => {
        const fragment = readSource(`${directory}gaussianSplatting.fragment.fx`);
        const pluginHook = fragment.indexOf("#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR");
        const geometryOutput = fragment.indexOf("#include<geometryRenderingFragment>");

        expect(fragment).toContain("#define PREPASS_CUSTOM_VARYINGS");
        expect(fragment).toContain("#include<prePassDeclaration>[SCENE_MRT_COUNT]");
        expect(pluginHook).toBeGreaterThanOrEqual(0);
        expect(geometryOutput).toBeGreaterThan(pluginHook);
    });

    it.each(shaderLanguages)("$name computes motion from the rendered splat plane and supports compound history", ({ directory }) => {
        const vertex = readSource(`${directory}gaussianSplatting.vertex.fx`);

        expect(vertex).toContain("geometryPlanePositionW");
        expect(vertex).toContain("geometryPlanePositionL");
        expect(vertex).toContain("previousPartWorld");
        expect(vertex).toContain("vGeometryPreviousPosition");
    });

    it("makes zero-alpha discard conditional on the blend contract", () => {
        const fragment = readSource("ShadersWGSL/gaussianSplatting.fragment.fx");

        expect(fragment).toContain("finalColor.a <= 0.0 && uniforms.geometryZeroAlphaDiscard > 0.0");
    });
});

describe("Gaussian splatting geometry rendering bindings", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: GaussianSplattingMaterial;
    let renderPassId: number;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.setTransformMatrix(Matrix.Identity(), Matrix.Identity());
        material = new GaussianSplattingMaterial("gaussian", scene);
        renderPassId = engine.createRenderPassId("geometry");
        engine.currentRenderPassId = renderPassId;
    });

    afterEach(() => {
        MaterialHelperGeometryRendering.DeleteConfiguration(renderPassId);
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("registers inverseProjection for non-UBO geometry shaders", () => {
        const uniforms = (GaussianSplattingMaterial as unknown as { _Uniforms: string[] })._Uniforms;
        expect(uniforms).toContain("inverseProjection");
    });

    it("keeps compound previous transforms stable across repeated binds and clears released histories", () => {
        const world = Matrix.Identity();
        const partWorld = Matrix.Identity();
        const source = {
            uniqueId: 100,
            isCompound: true,
            partCount: 1,
            getScene: () => scene,
            getWorldMatrix: () => world,
            getWorldMatrixForPart: () => partWorld,
            bindExtraEffectUniforms: vi.fn(),
        } as unknown as GaussianSplattingMesh;
        material.setSourceMesh(source);
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);
        configuration.defines.PREPASS_VELOCITY_INDEX = 0;
        let previousTranslation = Number.NaN;
        const effect = {
            setMatrix: vi.fn(),
            setFloat: vi.fn(),
            setMatrices: (name: string, data: Float32Array) => {
                if (name === "previousPartWorld") {
                    previousTranslation = data[12];
                }
            },
        } as unknown as Effect;
        const internals = material as unknown as {
            _bindGeometryRendering: (effect: Effect, defines: object, mustRebind: boolean) => void;
            _partMotionHistory: Map<number, unknown>;
        };
        const defines = { PREPASS: true, PREPASS_VELOCITY: true, MAX_PART_COUNT: 4 };
        const frameId = vi.spyOn(engine, "frameId", "get").mockReturnValue(0);

        internals._bindGeometryRendering(effect, defines, false);
        expect(previousTranslation).toBe(0);
        frameId.mockReturnValue(1);
        Matrix.TranslationToRef(2, 0, 0, partWorld);
        internals._bindGeometryRendering(effect, defines, false);
        expect(previousTranslation).toBe(0);
        Matrix.TranslationToRef(3, 0, 0, partWorld);
        internals._bindGeometryRendering(effect, defines, false);
        expect(previousTranslation).toBe(0);
        frameId.mockReturnValue(2);
        internals._bindGeometryRendering(effect, defines, false);
        expect(previousTranslation).toBe(3);
        frameId.mockReturnValue(5);
        Matrix.TranslationToRef(9, 0, 0, partWorld);
        internals._bindGeometryRendering(effect, defines, false);
        expect(previousTranslation).toBe(9);

        expect(internals._partMotionHistory.has(renderPassId)).toBe(true);
        engine.releaseRenderPassId(renderPassId);
        expect(internals._partMotionHistory.has(renderPassId)).toBe(false);
    });
});
