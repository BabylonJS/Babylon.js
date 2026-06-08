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
    const makeSkinnedMesh = (boneCount: number, opts: { maxVertexUniformVectors?: number; isUsingTextureForMatrices?: boolean; multiview?: boolean } = {}): AbstractMesh => {
        const { maxVertexUniformVectors = 16, isUsingTextureForMatrices = false, multiview = false } = opts;
        return {
            useBones: true,
            computeBonesUsingShaders: true,
            numBoneInfluencers: 4,
            skeleton: { name: "test", bones: new Array(boneCount).fill({}), isUsingTextureForMatrices },
            getScene: () => ({
                prePassRenderer: null,
                activeCamera: { outputRenderTarget: multiview ? { getViewCount: () => 2 } : null },
                getEngine: () => ({ getCaps: () => ({ maxVertexUniformVectors }) }),
            }),
        } as unknown as AbstractMesh;
    };

    it("warns (once) and recommends a bone texture when uniform bones overflow the budget", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        PrepareDefinesForBones(makeSkinnedMesh(30), { BONETEXTURE: false });
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
        PrepareDefinesForBones(makeSkinnedMesh(30, { maxVertexUniformVectors: 256, multiview: true }), { BONETEXTURE: false });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0][0])).toContain("multiview");
        warn.mockRestore();
    });
});
