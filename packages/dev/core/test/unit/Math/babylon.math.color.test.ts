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
