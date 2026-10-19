import { AlphaState } from "core/States/alphaCullingState";
import { Constants } from "core/Engines/constants";
import { describe, expect, it, vi } from "vitest";

describe("AlphaState", () => {
    it("configures RGB replacement with source-over alpha", () => {
        const alphaState = new AlphaState(false);

        alphaState.setAlphaMode(Constants.ALPHA_REPLACE_COLOR, 0);

        expect(alphaState._blendFunctionParameters.slice(0, 4)).toEqual([1, 0, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA]);
    });

    it("disables blending on integer MRT attachments", () => {
        const alphaState = new AlphaState(true);
        const enableIndexed = vi.fn();
        const disableIndexed = vi.fn();
        const gl = {
            BLEND: 0x0be2,
            enableIndexed,
            disableIndexed,
        } as unknown as WebGLRenderingContext;

        alphaState.setAlphaBlend(true);
        alphaState.apply(gl, 2, 1 << 1);

        expect(enableIndexed).toHaveBeenCalledExactlyOnceWith(0x0be2, 0);
        expect(disableIndexed).toHaveBeenCalledExactlyOnceWith(0x0be2, 1);
    });

    it("rejects blended mixed MRTs without per-target blend parameters", () => {
        const alphaState = new AlphaState(false);

        alphaState.setAlphaBlend(true);

        expect(() => alphaState.apply({ BLEND: 0x0be2 } as WebGLRenderingContext, 2, 1 << 1)).toThrow("blending with integer MRT attachments requires per-target blend parameters");
    });
});
