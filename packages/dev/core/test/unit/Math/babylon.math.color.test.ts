import { describe, expect, it } from "vitest";
import { Color3, Color4 } from "../../../src/Maths/math.color.pure";

describe("Color hex strings", () => {
    it("formats in-range Color3 components", () => {
        expect(new Color3(1, 0.5, 0).toHexString()).toBe("#FF8000");
    });

    it("clamps Color3 components outside of [0, 1]", () => {
        expect(new Color3(2, 0.5, -0.25).toHexString()).toBe("#FF8000");
        expect(Color3.FromHexString(new Color3(1.5, 3, 10).toHexString()).asArray()).toEqual([1, 1, 1]);
    });

    it("clamps Color4 components outside of [0, 1]", () => {
        const color = new Color4(4, -1, 0.5, 1.2);
        expect(color.toHexString()).toBe("#FF0080FF");
        expect(color.toHexString(true)).toBe("#FF0080");
    });
});

describe("Color3.FromHSV", () => {
    it("converts hues in [0, 360]", () => {
        expect(Color3.FromHSV(0, 1, 1).asArray()).toEqual([1, 0, 0]);
        expect(Color3.FromHSV(120, 1, 1).asArray()).toEqual([0, 1, 0]);
        expect(Color3.FromHSV(240, 1, 1).asArray()).toEqual([0, 0, 1]);
        expect(Color3.FromHSV(360, 1, 1).asArray()).toEqual([1, 0, 0]);
    });

    it("wraps hues above 360", () => {
        expect(Color3.FromHSV(480, 1, 1).asArray()).toEqual([0, 1, 0]);
        expect(Color3.FromHSV(720 + 240, 1, 1).asArray()).toEqual([0, 0, 1]);
    });

    it("wraps negative hues", () => {
        expect(Color3.FromHSV(-120, 1, 1).asArray()).toEqual([0, 0, 1]);
        expect(Color3.FromHSV(-360, 1, 1).asArray()).toEqual([1, 0, 0]);
    });

    it("round trips through toHSV", () => {
        const color = new Color3(0.2, 0.6, 0.9);
        const hsv = color.toHSV();
        const back = Color3.FromHSV(hsv.r + 360, hsv.g, hsv.b);
        expect(back.r).toBeCloseTo(color.r, 6);
        expect(back.g).toBeCloseTo(color.g, 6);
        expect(back.b).toBeCloseTo(color.b, 6);
    });
});
