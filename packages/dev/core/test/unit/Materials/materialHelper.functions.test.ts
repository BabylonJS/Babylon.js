import { describe, it, expect, vi } from "vitest";
import {
    PrepareUniformsAndSamplersForLight,
    PrepareDefinesForBones,
    PrepareDefinesForLights,
    GetSupportedSimultaneousLights,
    BindLights,
    AreLightsTexturesReady,
} from "core/Materials/materialHelper.functions";
import { Logger } from "core/Misc/logger";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Scene } from "core/scene";

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

describe("PrepareDefinesForBones uniform-budget warning", () => {
    const makeSkinnedMesh = (boneCount: number, opts: { maxVertexUniformVectors?: number; isUsingTextureForMatrices?: boolean } = {}): AbstractMesh => {
        const { maxVertexUniformVectors = 16, isUsingTextureForMatrices = false } = opts;
        return {
            useBones: true,
            computeBonesUsingShaders: true,
            numBoneInfluencers: 4,
            skeleton: { name: "test", bones: new Array(boneCount).fill({}), isUsingTextureForMatrices },
            getScene: () => ({
                prePassRenderer: null,
                getEngine: () => ({ getCaps: () => ({ maxVertexUniformVectors }) }),
            }),
        } as unknown as AbstractMesh;
    };

    it("warns once per skeleton (deduped across calls) and recommends a bone texture on overflow", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const mesh = makeSkinnedMesh(30);
        PrepareDefinesForBones(mesh, { BONETEXTURE: false });
        PrepareDefinesForBones(mesh, { BONETEXTURE: false }); // same skeleton -> deduped, no second warn
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0][0])).toContain("useTextureToStoreBoneMatrices");
        warn.mockRestore();
    });

    it("does not warn when bones are stored in a texture", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        PrepareDefinesForBones(makeSkinnedMesh(30, { isUsingTextureForMatrices: true }), { BONETEXTURE: false });
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it("does not warn for a small skeleton that comfortably fits", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        PrepareDefinesForBones(makeSkinnedMesh(1, { maxVertexUniformVectors: 256 }), { BONETEXTURE: false });
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it("flags a bone array that dominates the budget under multiview even when it would fit otherwise", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        // 30 bones -> 124 vectors: fits 256 outright, but exceeds 256/3 once multiview shrinks the budget.
        // MULTIVIEW is read from the defines (set by PrepareDefinesForFrameBoundValues, which materials
        // run before the attributes/bones prepare) — no camera/render-target access on this path.
        PrepareDefinesForBones(makeSkinnedMesh(30, { maxVertexUniformVectors: 256 }), { BONETEXTURE: false, MULTIVIEW: true });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0][0])).toContain("multiview");
        warn.mockRestore();
    });

    it("re-evaluates when MULTIVIEW flips for a skeleton that fit in mono (the 2D -> XR transition)", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const mesh = makeSkinnedMesh(30, { maxVertexUniformVectors: 256 });
        // Mono: 124 vectors fit comfortably -> evaluated, no warn (and the signature is cached).
        PrepareDefinesForBones(mesh, { BONETEXTURE: false, MULTIVIEW: false });
        PrepareDefinesForBones(mesh, { BONETEXTURE: false, MULTIVIEW: false }); // same signature -> skipped
        expect(warn).not.toHaveBeenCalled();
        // Entering multiview changes the signature -> the budget re-evaluates and now warns.
        PrepareDefinesForBones(mesh, { BONETEXTURE: false, MULTIVIEW: true });
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });
});

describe("maxSimultaneousLights clamping against the per-stage uniform buffer limit", () => {
    // One uniform buffer per light in the vertex stage, plus the scene, mesh and material buffers, so a
    // device reporting the WebGPU/D3D12 maximum of 12 supports 12 - 3 = 9 simultaneous lights.
    const webGpuLimit = 12;
    const supportedForWebGpu = 9;

    const makeScene = (maxUniformBuffersPerShaderStage?: number): Scene => {
        // A single engine instance per scene: the warning is deduped per engine, so handing out a fresh
        // object on every getEngine() call would defeat it.
        const engine = { getCaps: () => ({ maxUniformBuffersPerShaderStage }) };
        return {
            lightsEnabled: true,
            shadowsEnabled: false,
            activeCamera: null,
            getEngine: () => engine,
        } as unknown as Scene;
    };

    const spyOnWarn = () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        warn.mockClear();
        return warn;
    };

    const makeLight = () =>
        ({
            prepareLightSpecificDefines: () => {},
            falloffType: 0,
            specular: { equalsFloats: () => true },
            shadowEnabled: false,
            getShadowGenerator: () => null,
            lightmapMode: 0,
            _bindLight: () => {},
        }) as any;

    const makeMesh = (lightCount: number): AbstractMesh =>
        ({
            lightSources: new Array(lightCount).fill(null).map(makeLight),
            receiveShadows: false,
        }) as unknown as AbstractMesh;

    const makeDefines = () => ({ _areLightsDirty: true, _needNormals: false, rebuild: () => {} }) as any;

    it("reports the requested count unchanged on engines that do not report the limit", () => {
        // WebGL and native do not enforce a per-stage uniform buffer count, so nothing should be clamped.
        expect(GetSupportedSimultaneousLights(makeScene(undefined), 10)).toBe(10);
    });

    it("clamps the requested count to the device budget", () => {
        expect(GetSupportedSimultaneousLights(makeScene(webGpuLimit), 10)).toBe(supportedForWebGpu);
    });

    it("leaves a request that already fits alone", () => {
        expect(GetSupportedSimultaneousLights(makeScene(webGpuLimit), 4)).toBe(4);
    });

    it("always keeps at least one light, even on an unusually low limit", () => {
        expect(GetSupportedSimultaneousLights(makeScene(2), 4)).toBe(1);
    });

    it("caps the generated defines at the supported count so pipeline creation stays within the limit", () => {
        const warn = spyOnWarn();
        const defines = makeDefines();
        PrepareDefinesForLights(makeScene(webGpuLimit), makeMesh(10), defines, true, 10);
        expect(defines["LIGHTCOUNT"]).toBe(supportedForWebGpu);
        expect(defines["MAXLIGHTCOUNT"]).toBe(supportedForWebGpu);
        expect(defines["LIGHT" + (supportedForWebGpu - 1)]).toBe(true);
        expect(defines["LIGHT" + supportedForWebGpu]).toBeFalsy();
        warn.mockRestore();
    });

    it("warns once, naming maxSimultaneousLights and the supported count", () => {
        const warn = spyOnWarn();
        const scene = makeScene(webGpuLimit);
        PrepareDefinesForLights(scene, makeMesh(10), makeDefines(), true, 10);
        PrepareDefinesForLights(scene, makeMesh(10), makeDefines(), true, 10); // same engine and light count -> deduped
        expect(warn).toHaveBeenCalledTimes(1);
        const message = String(warn.mock.calls[0][0]);
        expect(message).toContain("maxSimultaneousLights");
        expect(message).toContain(String(supportedForWebGpu));
        warn.mockRestore();
    });

    it("reports the buffer cost of the lights in use, not of maxSimultaneousLights", () => {
        const warn = spyOnWarn();
        // A very high cap on a mesh with 10 lights costs 10 + 3 buffers, not 64 + 3.
        PrepareDefinesForLights(makeScene(webGpuLimit), makeMesh(10), makeDefines(), true, 64);
        expect(warn).toHaveBeenCalledTimes(1);
        const message = String(warn.mock.calls[0][0]);
        expect(message).toContain("the 10 lights affecting this mesh");
        expect(message).toContain("13 uniform buffers");
        expect(message).not.toContain("67 uniform buffers");
        warn.mockRestore();
    });

    it("does not warn when the clamp drops no light", () => {
        const warn = spyOnWarn();
        // maxSimultaneousLights is over the budget, but the mesh has few enough lights that the per-light
        // uniform buffers stay well within the limit, so there is nothing to report.
        PrepareDefinesForLights(makeScene(webGpuLimit), makeMesh(3), makeDefines(), true, 10);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it("does not warn on engines that do not report the limit", () => {
        const warn = spyOnWarn();
        const defines = makeDefines();
        PrepareDefinesForLights(makeScene(undefined), makeMesh(10), defines, true, 10);
        expect(warn).not.toHaveBeenCalled();
        expect(defines["LIGHTCOUNT"]).toBe(10);
        warn.mockRestore();
    });

    it("binds no more lights than the defines declare", () => {
        const mesh = makeMesh(10);
        const bound: number[] = [];
        for (const light of mesh.lightSources) {
            light._bindLight = (index: number) => bound.push(index);
        }
        BindLights(makeScene(webGpuLimit), mesh, {} as any, { SPECULARTERM: false }, 10);
        expect(bound).toHaveLength(supportedForWebGpu);
    });

    it("does not gate readiness on a light the shader will never use", () => {
        const mesh = makeMesh(10);
        // Only the light that the clamp drops is not ready: the material should still report ready.
        for (const light of mesh.lightSources) {
            light.areLightTexturesReady = () => true;
        }
        mesh.lightSources[9].areLightTexturesReady = () => false;
        expect(AreLightsTexturesReady(makeScene(webGpuLimit), mesh, 10)).toBe(true);
        // A light that is actually used still gates readiness.
        mesh.lightSources[0].areLightTexturesReady = () => false;
        expect(AreLightsTexturesReady(makeScene(webGpuLimit), mesh, 10)).toBe(false);
    });
});
