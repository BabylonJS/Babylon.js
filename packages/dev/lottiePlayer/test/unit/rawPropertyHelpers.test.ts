import { describe, it, expect } from "vitest";
import { GetInitialVectorValues, GetAllVectorKeyframeValues, GetInitialBezierData, GetAllBezierKeyframeData, GetLargestVectorValues, GetLargestBezierData } from "../../src/parsing/rawPropertyHelpers";
import type { RawBezier, RawBezierShapeProperty, RawPositionProperty, RawVectorProperty } from "../../src/parsing/rawTypes";

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

describe("GetAllVectorKeyframeValues", () => {
    it("returns single-element array for static property", () => {
        const property: RawVectorProperty = { a: 0, k: [50, 100], l: 2 };
        expect(GetAllVectorKeyframeValues(property)).toEqual([[50, 100]]);
    });

    it("returns all keyframe values for animated property", () => {
        const property: RawVectorProperty = {
            a: 1,
            k: [
                { t: 0, s: [10, 20] },
                { t: 30, s: [50, 100] },
                { t: 60, s: [80, 150] },
            ],
            l: 2,
        };
        expect(GetAllVectorKeyframeValues(property)).toEqual([
            [10, 20],
            [50, 100],
            [80, 150],
        ]);
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

describe("GetAllBezierKeyframeData", () => {
    it("returns single-element array for static property", () => {
        const bezier = makeBezier([[0, 0], [10, 0], [10, 10]]);
        const property: RawBezierShapeProperty = { a: 0, k: bezier };
        expect(GetAllBezierKeyframeData(property)).toEqual([bezier]);
    });

    it("returns all keyframe beziers for animated property", () => {
        const bezier1 = makeBezier([[0, 0], [10, 0], [10, 10]]);
        const bezier2 = makeBezier([[0, 0], [20, 0], [20, 20]]);
        const property: RawBezierShapeProperty = {
            a: 1,
            k: [
                { t: 0, s: [bezier1] },
                { t: 30, s: [bezier2] },
            ],
        };
        expect(GetAllBezierKeyframeData(property)).toEqual([bezier1, bezier2]);
    });
});

describe("GetLargestVectorValues", () => {
    it("returns static value when not animated", () => {
        const property: RawVectorProperty = { a: 0, k: [50, 100], l: 2 };
        expect(GetLargestVectorValues(property)).toEqual([50, 100]);
    });

    it("returns element-wise max across all keyframes", () => {
        const property: RawVectorProperty = {
            a: 1,
            k: [
                { t: 0, s: [40, 80] },
                { t: 30, s: [200, 50] },
                { t: 60, s: [100, 120] },
            ],
            l: 2,
        };
        expect(GetLargestVectorValues(property)).toEqual([200, 120]);
    });

    it("returns single keyframe value when only one keyframe", () => {
        const property: RawVectorProperty = {
            a: 1,
            k: [{ t: 0, s: [30, 60] }],
            l: 2,
        };
        expect(GetLargestVectorValues(property)).toEqual([30, 60]);
    });
});

describe("GetLargestBezierData", () => {
    it("returns static bezier when not animated", () => {
        const bezier = makeBezier([[0, 0], [10, 0], [10, 10]]);
        const property: RawBezierShapeProperty = { a: 0, k: bezier };
        expect(GetLargestBezierData(property)).toBe(bezier);
    });

    it("returns the bezier with the largest area for animated property", () => {
        const small = makeBezier([[0, 0], [10, 0], [10, 10], [0, 10]]);
        const large = makeBezier([[0, 0], [50, 0], [50, 30], [0, 30]]);
        const property: RawBezierShapeProperty = {
            a: 1,
            k: [
                { t: 0, s: [small] },
                { t: 30, s: [large] },
            ],
        };
        expect(GetLargestBezierData(property)).toBe(large);
    });

    it("returns undefined for animated with empty keyframes", () => {
        const property: RawBezierShapeProperty = { a: 1, k: [] };
        expect(GetLargestBezierData(property)).toBeUndefined();
    });
});
