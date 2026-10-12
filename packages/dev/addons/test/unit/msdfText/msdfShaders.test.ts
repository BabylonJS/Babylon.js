import { describe, expect, it } from "vitest";

import { msdfPixelShader } from "../../../src/msdfText/shaders/msdf.fragment";
import { msdfPixelShaderWGSL } from "../../../src/msdfText/shadersWGSL/msdf.fragment";

// Where the distance field is flat, the screen-space derivative is 0 and dividing by it is undefined.
// SwiftShader, for example, returns -0 from fwidth(), which inverts the coverage and renders opaque glyph quads.
describe("MSDF fragment shaders", () => {
    it("guards every fwidth() denominator in the GLSL shader", () => {
        expect(msdfPixelShader.shader).not.toMatch(/\/\s*fwidth\(/);
        expect(msdfPixelShader.shader.match(/\/\s*max\(\s*fwidth\(/g)).toHaveLength(3);
    });

    it("guards every derivative length used as a denominator in the WGSL shader", () => {
        expect(msdfPixelShaderWGSL.shader).not.toMatch(/=\s*length\(\s*vec2<f32>\(\s*dpdx\(/);
        expect(msdfPixelShaderWGSL.shader.match(/=\s*max\(\s*length\(\s*vec2<f32>\(\s*dpdx\(/g)).toHaveLength(3);
    });
});
