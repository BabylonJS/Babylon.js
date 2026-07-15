import { AlphaState } from "core/States/alphaCullingState";
import { describe, expect, it, vi } from "vitest";

function createMockContext(): WebGLRenderingContext {
    return {
        BLEND: 0x0be2,
        SAMPLE_ALPHA_TO_COVERAGE: 0x809e,
        disable: vi.fn(),
        enable: vi.fn(),
    } as unknown as WebGLRenderingContext;
}

describe("AlphaState", () => {
    it("applies alpha-to-coverage changes once", () => {
        const alphaState = new AlphaState(false);
        const context = createMockContext();

        alphaState.apply(context);
        vi.mocked(context.disable).mockClear();

        alphaState.alphaToCoverage = true;
        alphaState.apply(context);
        alphaState.apply(context);

        expect(context.enable).toHaveBeenCalledTimes(1);
        expect(context.enable).toHaveBeenCalledWith(context.SAMPLE_ALPHA_TO_COVERAGE);

        alphaState.alphaToCoverage = false;
        alphaState.apply(context);

        expect(context.disable).toHaveBeenCalledTimes(1);
        expect(context.disable).toHaveBeenCalledWith(context.SAMPLE_ALPHA_TO_COVERAGE);
    });
});
