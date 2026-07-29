import { describe, expect, it } from "vitest";

import { BuildLottieMatrix, BuildLottieMatrixInto, MultiplyMat2D, MultiplyMat2DInto, TransformPoint, type Mat2D } from "../../src/animation/matrix2D";
import { BuildContourPoints } from "../../src/animation/geometry";
import { BuildDashedStrokePoints, BuildStrokePoints } from "../../src/rendering/vector/strokeGeometry";
import { type IShapeData } from "../../src/animation/lottieRaw";

const Identity: Mat2D = [1, 0, 0, 1, 0, 0];

describe("matrix2D", () => {
    it("treats the identity as a no-op", () => {
        const out: [number, number] = [0, 0];
        TransformPoint(Identity, 3, 4, out);
        expect(out).toEqual([3, 4]);
    });

    it("applies the inner matrix first when multiplying", () => {
        const translate: Mat2D = [1, 0, 0, 1, 10, 0];
        const scale: Mat2D = [2, 0, 0, 2, 0, 0];
        const out: [number, number] = [0, 0];
        // scale * translate scales the already-translated point.
        TransformPoint(MultiplyMat2D(scale, translate), 1, 0, out);
        expect(out).toEqual([22, 0]);
        // translate * scale translates the already-scaled point.
        TransformPoint(MultiplyMat2D(translate, scale), 1, 0, out);
        expect(out).toEqual([12, 0]);
    });

    it("writes an alias-safe product into an existing matrix", () => {
        const translate: Mat2D = [1, 0, 0, 1, 10, 0];
        const scale: Mat2D = [2, 0, 0, 2, 0, 0];
        MultiplyMat2DInto(scale, translate, translate);
        expect(translate).toEqual([2, 0, 0, 2, 20, 0]);
    });

    it("maps the anchor onto the position", () => {
        const m = BuildLottieMatrix([5, 5], [100, 50], [100, 100], 0);
        const out: [number, number] = [0, 0];
        TransformPoint(m, 5, 5, out);
        expect(out[0]).toBeCloseTo(100, 6);
        expect(out[1]).toBeCloseTo(50, 6);
    });

    it("treats scale as a percentage", () => {
        const m = BuildLottieMatrix([0, 0], [0, 0], [200, 50], 0);
        const out: [number, number] = [0, 0];
        TransformPoint(m, 10, 10, out);
        expect(out[0]).toBeCloseTo(20, 6);
        expect(out[1]).toBeCloseTo(5, 6);
    });

    it("rotates by degrees", () => {
        const m = BuildLottieMatrix([0, 0], [0, 0], [100, 100], 90);
        const out: [number, number] = [0, 0];
        TransformPoint(m, 1, 0, out);
        expect(out[0]).toBeCloseTo(0, 6);
        expect(out[1]).toBeCloseTo(1, 6);
    });

    it("builds into an existing matrix", () => {
        const result: Mat2D = [0, 0, 0, 0, 0, 0];
        BuildLottieMatrixInto([5, 5], [100, 50], [100, 100], 0, result);
        const expected = [1, 0, 0, 1, 95, 45];
        for (let i = 0; i < result.length; i++) {
            expect(result[i]).toBeCloseTo(expected[i], 6);
        }
    });
});

describe("BuildContourPoints", () => {
    const straightSquare: IShapeData = {
        v: [
            [0, 0],
            [100, 0],
            [100, 100],
            [0, 100],
        ],
        i: [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
        ],
        o: [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
        ],
        c: true,
    };

    it("emits one point per vertex for a closed straight-edged contour", () => {
        const out: number[] = [];
        // 4 segments each contributing their end point, plus the starting point.
        expect(BuildContourPoints(straightSquare, Identity, out)).toBe(5);
        expect(out.slice(0, 4)).toEqual([0, 0, 100, 0]);
    });

    it("skips the wrap-around segment when the contour is open", () => {
        const out: number[] = [];
        expect(BuildContourPoints({ ...straightSquare, c: false }, Identity, out)).toBe(4);
    });

    it("returns zero for a degenerate contour", () => {
        const out: number[] = [];
        expect(BuildContourPoints({ v: [[0, 0]], i: [[0, 0]], o: [[0, 0]], c: false }, Identity, out)).toBe(0);
        expect(out).toHaveLength(0);
    });

    it("subdivides a curved segment into several points", () => {
        const curved: IShapeData = {
            v: [
                [0, 0],
                [100, 0],
            ],
            i: [
                [0, 0],
                [-50, -50],
            ],
            o: [
                [50, 50],
                [0, 0],
            ],
            c: false,
        };
        const out: number[] = [];
        expect(BuildContourPoints(curved, Identity, out)).toBeGreaterThan(2);
    });

    it("maps points through the supplied matrix", () => {
        const out: number[] = [];
        BuildContourPoints(straightSquare, [2, 0, 0, 2, 5, 5], out);
        expect(out[0]).toBeCloseTo(5, 6);
        expect(out[2]).toBeCloseTo(205, 6);
    });
});

describe("stroke geometry", () => {
    // A single horizontal segment.
    const line = [0, 0, 100, 0];

    it("emits nothing for a degenerate stroke", () => {
        const out: number[] = [];
        expect(BuildStrokePoints(line, 2, 0, false, out)).toBe(0);
        expect(BuildStrokePoints([0, 0], 1, 5, false, out)).toBe(0);
    });

    it("expands a segment to the requested half width", () => {
        const out: number[] = [];
        // Butt caps keep the geometry to the segment quad alone: 2 triangles.
        expect(BuildStrokePoints(line, 2, 5, false, out, false)).toBe(6);
        const ys = out.filter((_, i) => i % 2 === 1);
        expect(Math.min(...ys)).toBeCloseTo(-5, 6);
        expect(Math.max(...ys)).toBeCloseTo(5, 6);
    });

    it("adds cap fans only when round caps are requested", () => {
        const butt: number[] = [];
        const round: number[] = [];
        BuildStrokePoints(line, 2, 5, false, butt, false);
        BuildStrokePoints(line, 2, 5, false, round, true);
        expect(round.length).toBeGreaterThan(butt.length);
    });

    it("falls back to a solid stroke when the dash pattern is empty", () => {
        const dashed: number[] = [];
        const solid: number[] = [];
        BuildDashedStrokePoints(line, 2, 5, false, 0, 0, 0, dashed);
        BuildStrokePoints(line, 2, 5, false, solid);
        expect(dashed.length).toBe(solid.length);
    });

    it("breaks a dashed stroke into multiple spans", () => {
        const out: number[] = [];
        // 100px line, 10 on / 10 off => 5 dashes.
        const verts = BuildDashedStrokePoints(line, 2, 2, false, 10, 10, 0, out, false);
        // Each dash is a quad (6 verts) with butt caps.
        expect(verts).toBe(5 * 6);
    });

    it("shifts the pattern by the dash offset", () => {
        const noOffset: number[] = [];
        const offset: number[] = [];
        BuildDashedStrokePoints(line, 2, 2, false, 10, 10, 0, noOffset, false);
        BuildDashedStrokePoints(line, 2, 2, false, 10, 10, 10, offset, false);
        expect(offset).not.toEqual(noOffset);
    });

    it("keeps a round-capped dash at its nominal length", () => {
        const out: number[] = [];
        // Caps are inset, so a 20px dash with 5px half width still spans 20px.
        BuildDashedStrokePoints(line, 2, 5, false, 20, 20, 0, out, true);
        const xs = out.filter((_, i) => i % 2 === 0);
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(-1e-6);
        expect(Math.max(...xs)).toBeLessThanOrEqual(100 + 1e-6);
    });
});
