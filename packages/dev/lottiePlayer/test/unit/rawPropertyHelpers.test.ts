import { describe, it, expect } from "vitest";
import { GetInitialScalarValue, GetInitialVectorValues, GetInitialBezierData } from "../../src/parsing/rawPropertyHelpers";
import type { RawBezier, RawBezierShapeProperty, RawPositionProperty, RawScalarProperty, RawVectorProperty } from "../../src/parsing/rawTypes";

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
        const bezier = makeBezier([[0, 0], [10, 0], [10, 10]]);
        const property: RawBezierShapeProperty = { a: 0, k: bezier };
        expect(GetInitialBezierData(property)).toBe(bezier);
    });

    it("returns first keyframe bezier when animated", () => {
        const bezier1 = makeBezier([[0, 0], [10, 0], [10, 10]]);
        const bezier2 = makeBezier([[0, 0], [20, 0], [20, 20]]);
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

    it("returns default value when animated with empty keyframes", () => {
        const property: RawScalarProperty = { a: 1, k: [] };
        expect(GetInitialScalarValue(property, 0)).toBe(0);
    });
});
