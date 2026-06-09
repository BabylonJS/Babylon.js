import { describe, it, expect, vi } from "vitest";
import { PrepareUniformsAndSamplersForLight, PrepareDefinesForBones } from "core/Materials/materialHelper.functions";
import { Logger } from "core/Misc/logger";
import { type AbstractMesh } from "core/Meshes/abstractMesh";

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
