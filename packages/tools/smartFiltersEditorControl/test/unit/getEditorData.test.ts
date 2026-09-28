import { describe, expect, it, vi } from "vitest";
import { GetTextureInputBlockEditorData, GetTextureInputBlockUrl } from "../../src/graphSystem/getEditorData.js";

type TextureInputBlock = Parameters<typeof GetTextureInputBlockEditorData>[0];

describe("texture editor compatibility", () => {
    it("reads editor metadata from a full Smart Filter texture", () => {
        const getInternalTexture = vi.fn(() => ({
            url: "https://example.com/full.png",
            anisotropicFilteringLevel: 8,
            invertY: false,
            _extension: ".png",
        }));
        const inputBlock = {
            editorData: null,
            runtimeValue: {
                value: { getInternalTexture },
            },
        } as unknown as TextureInputBlock;

        expect(GetTextureInputBlockEditorData(inputBlock)).toEqual({
            url: "https://example.com/full.png",
            urlTypeHint: null,
            anisotropicFilteringLevel: 8,
            flipY: false,
            forcedExtension: ".png",
        });
        expect(getInternalTexture).toHaveBeenCalledOnce();
    });

    it("uses safe defaults for a Lite GLTexture", () => {
        const inputBlock = {
            editorData: null,
            runtimeValue: {
                value: {
                    handle: {},
                    target: 3553,
                    width: 64,
                    height: 32,
                    isReady: true,
                },
            },
        } as unknown as TextureInputBlock;

        expect(GetTextureInputBlockEditorData(inputBlock)).toEqual({
            url: null,
            urlTypeHint: null,
            anisotropicFilteringLevel: null,
            flipY: true,
            forcedExtension: null,
        });
        expect(GetTextureInputBlockUrl(inputBlock)).toBeNull();
    });

    it("preserves the full texture URL fallback when editor metadata has no URL", () => {
        const inputBlock = {
            editorData: {
                url: null,
                urlTypeHint: null,
                anisotropicFilteringLevel: null,
                flipY: true,
                forcedExtension: null,
            },
            runtimeValue: {
                value: {
                    getInternalTexture: () => ({ url: "https://example.com/fallback.png" }),
                },
            },
        } as unknown as TextureInputBlock;

        expect(GetTextureInputBlockUrl(inputBlock)).toBe("https://example.com/fallback.png");
    });
});
