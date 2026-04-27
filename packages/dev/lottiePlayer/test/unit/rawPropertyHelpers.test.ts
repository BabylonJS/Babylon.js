import { describe, it, expect } from "vitest";
import { GetInitialColorValue, GetInitialScalarValue, GetInitialVectorValues, GetInitialBezierData } from "../../src/parsing/rawPropertyHelpers";
import type { RawBezier, RawBezierShapeProperty, RawColorProperty, RawPositionProperty, RawScalarProperty, RawVectorProperty } from "../../src/parsing/rawTypes";

function makeBezier(vertices: number[][]): RawBezier {
    return {
        c: true,
        v: vertices,
        i: vertices.map(() => [0, 0]),
        o: vertices.map(() => [0, 0]),
    };
}

describe("GetInitialVectorValues", () => {
    it("returns static value when not animated", () => {
        const property: RawVectorProperty = { a: 0, k: [50, 100], l: 2 };
        expect(GetInitialVectorValues(property)).toEqual([50, 100]);
    });

    it("returns first keyframe value when animated", () => {
        const property: RawVectorProperty = {
            a: 1,
            k: [
                { t: 0, s: [10, 20] },
                { t: 30, s: [50, 100] },
            ],
            l: 2,
        };
        expect(GetInitialVectorValues(property)).toEqual([10, 20]);
    });

    it("returns [0, 0] when animated with empty keyframes", () => {
        const property: RawVectorProperty = { a: 1, k: [], l: 2 };
        expect(GetInitialVectorValues(property)).toEqual([0, 0]);
    });

    it("works with RawPositionProperty", () => {
        const property: RawPositionProperty = { a: 0, k: [200, 300], l: 2 };
        expect(GetInitialVectorValues(property)).toEqual([200, 300]);
    });
});

describe("GetInitialBezierData", () => {
    it("returns static bezier when not animated", () => {
        const bezier = makeBezier([
            [0, 0],
            [10, 0],
            [10, 10],
        ]);
        const property: RawBezierShapeProperty = { a: 0, k: bezier };
        expect(GetInitialBezierData(property)).toBe(bezier);
    });

    it("returns first keyframe bezier when animated", () => {
        const bezier1 = makeBezier([
            [0, 0],
            [10, 0],
            [10, 10],
        ]);
        const bezier2 = makeBezier([
            [0, 0],
            [20, 0],
            [20, 20],
        ]);
        const property: RawBezierShapeProperty = {
            a: 1,
            k: [
                { t: 0, s: [bezier1] },
                { t: 30, s: [bezier2] },
            ],
        };
        expect(GetInitialBezierData(property)).toBe(bezier1);
    });

    it("returns undefined for animated with empty keyframes", () => {
        const property: RawBezierShapeProperty = { a: 1, k: [] };
        expect(GetInitialBezierData(property)).toBeUndefined();
    });
});

describe("GetInitialScalarValue", () => {
    it("returns static value when not animated", () => {
        const property: RawScalarProperty = { a: 0, k: 8 };
        expect(GetInitialScalarValue(property)).toBe(8);
    });

    it("returns first keyframe value when animated", () => {
        const property: RawScalarProperty = {
            a: 1,
            k: [
                { t: 0, s: [5] },
                { t: 30, s: [25] },
            ],
        };
        expect(GetInitialScalarValue(property)).toBe(5);
    });

    it("returns first keyframe value for an animated dash length (regression for I-02)", () => {
        // Lottie stroke dash entries (`st.d[i].v`) are RawScalarProperty. When animated (a=1),
        // `k` is a keyframe array. Casting `k as number` fed a non-numeric object to
        // `ctx.setLineDash()`, which silently dropped the whole dash pattern. The helper must
        // return the first-keyframe scalar so the initial dash length is rasterized.
        const dashLength: RawScalarProperty = {
            a: 1,
            k: [
                { t: 0, s: [12] },
                { t: 30, s: [4] },
            ],
        };
        expect(GetInitialScalarValue(dashLength)).toBe(12);
    });

    it("returns default value when animated with empty keyframes", () => {
        const property: RawScalarProperty = { a: 1, k: [] };
        expect(GetInitialScalarValue(property, 0)).toBe(0);
    });
});

describe("GetInitialColorValue", () => {
    it("returns static rgb value when not animated", () => {
        const property: RawColorProperty = { a: 0, k: [1, 0.5, 0.25] };
        expect(GetInitialColorValue(property)).toEqual([1, 0.5, 0.25]);
    });

    it("returns first keyframe value when animated (regression for I-01)", () => {
        // Lottie animated color: a=1 means k is a keyframe array, not a number[].
        // Casting `k as number[]` would feed the keyframe-object array to the CSS color builder
        // and silently emit NaN/garbage. The helper must extract the first keyframe's `s`.
        const property: RawColorProperty = {
            a: 1,
            k: [
                { t: 0, s: [1, 0, 0] },
                { t: 30, s: [0, 0, 1] },
            ],
        };
        expect(GetInitialColorValue(property)).toEqual([1, 0, 0]);
    });

    it("returns provided default when animated with empty keyframes", () => {
        const property: RawColorProperty = { a: 1, k: [] };
        expect(GetInitialColorValue(property, [0.1, 0.2, 0.3])).toEqual([0.1, 0.2, 0.3]);
    });

    it("returns [0, 0, 0] default when animated with empty keyframes and no default provided", () => {
        const property: RawColorProperty = { a: 1, k: [] };
        expect(GetInitialColorValue(property)).toEqual([0, 0, 0]);
    });
});
