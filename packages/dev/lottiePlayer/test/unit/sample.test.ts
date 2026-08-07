import { describe, expect, it } from "vitest";

import { SampleEllipse, SampleMulti, SampleRect, SampleScalar, SampleShape } from "../../src/animation/sample";
import { type IProp, type IShapeData } from "../../src/animation/lottieRaw";

function Animated(keys: unknown[]): IProp {
    return { a: 1, k: keys };
}

function Static(value: unknown): IProp {
    return { a: 0, k: value };
}

/** Linear ease (control points on the diagonal) so interpolation is the plain fraction. */
const LinearEase = { i: { x: 1, y: 1 }, o: { x: 0, y: 0 } };

describe("SampleScalar", () => {
    it("returns the fallback when the property is absent", () => {
        expect(SampleScalar(undefined, 10, 42)).toBe(42);
    });

    it("returns the constant value of a static property", () => {
        expect(SampleScalar(Static(7), 10, 0)).toBe(7);
        // Static values are sometimes wrapped in an array.
        expect(SampleScalar(Static([7]), 10, 0)).toBe(7);
    });

    it("returns the fallback for an animated property with no keyframes", () => {
        expect(SampleScalar(Animated([]), 10, 42)).toBe(42);
    });

    it("clamps before the first and after the last keyframe", () => {
        const prop = Animated([
            { t: 10, s: [100], ...LinearEase },
            { t: 20, s: [0], ...LinearEase },
        ]);
        expect(SampleScalar(prop, 0, -1)).toBe(100);
        expect(SampleScalar(prop, 30, -1)).toBe(0);
    });

    it("interpolates linearly between keyframes", () => {
        const prop = Animated([
            { t: 0, s: [0], ...LinearEase },
            { t: 10, s: [100], ...LinearEase },
        ]);
        expect(SampleScalar(prop, 5, -1)).toBeCloseTo(50, 4);
    });

    it("holds the value across a segment flagged with h:1", () => {
        const prop = Animated([
            { t: 0, s: [0], h: 1 },
            { t: 10, s: [100] },
        ]);
        expect(SampleScalar(prop, 9, -1)).toBe(0);
    });

    it("prefers a legacy end value over the next keyframe's start", () => {
        const prop = Animated([
            { t: 0, s: [0], e: [50], ...LinearEase },
            { t: 10, s: [999], ...LinearEase },
        ]);
        expect(SampleScalar(prop, 5, -1)).toBeCloseTo(25, 4);
    });

    it("applies cubic-bezier easing rather than a linear ramp", () => {
        // cubic-bezier(0.42, 0, 0.58, 1) — ease-in-out: symmetric, so the midpoint stays at 50 but
        // the quarter point lags a linear ramp well behind 25.
        const prop = Animated([
            { t: 0, s: [0], i: { x: 0.58, y: 1 }, o: { x: 0.42, y: 0 } },
            { t: 10, s: [100], i: { x: 0.58, y: 1 }, o: { x: 0.42, y: 0 } },
        ]);
        expect(SampleScalar(prop, 5, -1)).toBeCloseTo(50, 3);
        expect(SampleScalar(prop, 2.5, -1)).toBeLessThan(20);
    });
});

describe("SampleMulti", () => {
    it("leaves the output untouched when the property is absent", () => {
        const out = [1, 2];
        expect(SampleMulti(undefined, 0, out)).toEqual([1, 2]);
    });

    it("reads separate-dimension properties from x and y", () => {
        const prop: IProp = { a: 0, k: 0, s: true, x: Static(3), y: Static(4) };
        expect(SampleMulti(prop, 0, [0, 0])).toEqual([3, 4]);
    });

    it("leaves the output untouched for an animated property with no keyframes", () => {
        expect(SampleMulti(Animated([]), 10, [3, 4])).toEqual([3, 4]);
    });

    it("interpolates every component", () => {
        const prop = Animated([
            { t: 0, s: [0, 10], ...LinearEase },
            { t: 10, s: [100, 20], ...LinearEase },
        ]);
        const out = SampleMulti(prop, 5, [0, 0]);
        expect(out[0]).toBeCloseTo(50, 4);
        expect(out[1]).toBeCloseTo(15, 4);
    });
});

describe("SampleShape", () => {
    const shapeAt = (x: number): IShapeData => ({
        v: [
            [x, 0],
            [x + 10, 0],
        ],
        i: [
            [0, 0],
            [0, 0],
        ],
        o: [
            [0, 0],
            [0, 0],
        ],
        c: true,
    });

    it("returns the static shape unchanged", () => {
        const shape = shapeAt(0);
        expect(SampleShape(Static(shape), 5)).toBe(shape);
    });

    it("returns an empty contour for an animated shape with no keyframes", () => {
        expect(SampleShape(Animated([]), 5)).toEqual({ v: [], i: [], o: [], c: false });
    });

    it("lerps vertices between morph keyframes", () => {
        const prop = Animated([
            { t: 0, s: [shapeAt(0)], ...LinearEase },
            { t: 10, s: [shapeAt(100)], ...LinearEase },
        ]);
        const result = SampleShape(prop, 5);
        expect(result.v[0][0]).toBeCloseTo(50, 4);
        expect(result.v[1][0]).toBeCloseTo(60, 4);
        expect(result.c).toBe(true);
    });

    it("reuses the supplied contour for interpolated shapes", () => {
        const prop = Animated([
            { t: 0, s: [shapeAt(0)], ...LinearEase },
            { t: 10, s: [shapeAt(100)], ...LinearEase },
        ]);
        const out: IShapeData = { v: [], i: [], o: [], c: false };
        expect(SampleShape(prop, 5, out)).toBe(out);
        const firstVertex = out.v[0];
        SampleShape(prop, 7, out);
        expect(out.v[0]).toBe(firstVertex);
    });
});

describe("SampleRect", () => {
    it("produces four sharp corners when roundness is zero", () => {
        const shape = SampleRect({ p: Static([0, 0]), s: Static([100, 50]) }, 0);
        expect(shape.v).toHaveLength(4);
        expect(shape.c).toBe(true);
        // Zero tangents mean straight edges.
        expect(shape.i.every((t) => t[0] === 0 && t[1] === 0)).toBe(true);
        const xs = shape.v.map((v) => v[0]);
        expect(Math.min(...xs)).toBeCloseTo(-50, 4);
        expect(Math.max(...xs)).toBeCloseTo(50, 4);
    });

    it("produces eight vertices with arc tangents when rounded", () => {
        const shape = SampleRect({ p: Static([0, 0]), s: Static([100, 50]), r: Static(10) }, 0);
        expect(shape.v).toHaveLength(8);
        expect(shape.i.some((t) => t[0] !== 0 || t[1] !== 0)).toBe(true);
    });

    it("clamps roundness to half the shorter side", () => {
        const shape = SampleRect({ p: Static([0, 0]), s: Static([100, 50]), r: Static(999) }, 0);
        // Every vertex stays inside the rect bounds.
        for (const [x, y] of shape.v) {
            expect(Math.abs(x)).toBeLessThanOrEqual(50 + 1e-6);
            expect(Math.abs(y)).toBeLessThanOrEqual(25 + 1e-6);
        }
    });
});

describe("SampleEllipse", () => {
    it("produces four anchors with non-zero tangents", () => {
        const shape = SampleEllipse({ p: Static([10, 20]), s: Static([100, 60]) }, 0);
        expect(shape.v).toHaveLength(4);
        expect(shape.c).toBe(true);
        expect(shape.i.every((t) => t[0] !== 0 || t[1] !== 0)).toBe(true);
        const xs = shape.v.map((v) => v[0]);
        expect(Math.min(...xs)).toBeCloseTo(-40, 4);
        expect(Math.max(...xs)).toBeCloseTo(60, 4);
    });
});
