import { describe, expect, it } from "vitest";
import { pickingPixelShader } from "core/Shaders/picking.fragment";

describe("GPUPicker", () => {
    it("uses high precision integers for WebGL2 picking ID bit shifts", () => {
        expect(pickingPixelShader.shader).toContain("precision highp int;");
    });
});
