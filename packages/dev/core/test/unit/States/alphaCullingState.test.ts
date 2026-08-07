import { AlphaState } from "core/States/alphaCullingState";
import { Constants } from "core/Engines/constants";
import { describe, expect, it } from "vitest";

describe("AlphaState", () => {
    it("configures RGB replacement with source-over alpha", () => {
        const alphaState = new AlphaState(false);

        alphaState.setAlphaMode(Constants.ALPHA_REPLACE_COLOR, 0);

        expect(alphaState._blendFunctionParameters.slice(0, 4)).toEqual([1, 0, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA]);
    });
});
