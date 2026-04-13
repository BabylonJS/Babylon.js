import { describe, it, expect } from "vitest";
import { GetShapesBoundingBox } from "../../src/maths/boundingBox";
import type { RawBezier, RawElement, RawPathShape, RawRectangleShape } from "../../src/parsing/rawTypes";

function makeStaticRect(position: number[], size: number[]): RawRectangleShape {
    return {
        ty: "rc",
        d: 1,
        p: { a: 0, k: position, l: 2 },
        s: { a: 0, k: size, l: 2 },
        r: { a: 0, k: 0 },
    } as RawRectangleShape;
}

function makeAnimatedSizeRect(position: number[], sizes: { t: number; s: number[] }[]): RawRectangleShape {
    return {
        ty: "rc",
        d: 1,
        p: { a: 0, k: position, l: 2 },
        s: { a: 1, k: sizes, l: 2 },
        r: { a: 0, k: 0 },
    } as RawRectangleShape;
}

describe("GetShapesBoundingBox - rectangles", () => {
    it("computes correct bounding box for static rectangle", () => {
        const rect = makeStaticRect([0, 0], [100, 60]);
        const box = GetShapesBoundingBox([rect as unknown as RawElement]);

        expect(box.width).toBe(100);
        expect(box.height).toBe(60);
        expect(box.offsetX).toBe(0);
        expect(box.offsetY).toBe(0);
    });

    it("computes correct offset for static rectangle at non-origin position", () => {
        const rect = makeStaticRect([20, 30], [10, 10]);
        const box = GetShapesBoundingBox([rect as unknown as RawElement]);

        expect(box.width).toBe(10);
        expect(box.height).toBe(10);
        expect(box.offsetX).toBe(20);
        expect(box.offsetY).toBe(30);
    });

    it("uses initial keyframe for animated rectangle size", () => {
        const rect = makeAnimatedSizeRect([0, 0], [
            { t: 0, s: [10, 10] },
            { t: 30, s: [50, 50] },
        ]);
        const box = GetShapesBoundingBox([rect as unknown as RawElement]);

        // Uses first keyframe size (animated shape properties are not played back at runtime)
        expect(box.width).toBe(10);
        expect(box.height).toBe(10);
    });
});

function makeBezierSquare(size: number): RawBezier {
    const half = size / 2;
    return {
        c: true,
        v: [
            [-half, -half],
            [half, -half],
            [half, half],
            [-half, half],
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
    };
}

describe("GetShapesBoundingBox - paths", () => {
    it("computes correct bounding box for static path", () => {
        const path: RawPathShape = {
            ty: "sh",
            d: 1,
            ks: { a: 0, k: makeBezierSquare(10) },
        } as RawPathShape;

        const box = GetShapesBoundingBox([path as unknown as RawElement]);

        expect(box.width).toBe(10);
        expect(box.height).toBe(10);
    });

    it("uses initial keyframe for animated path", () => {
        const path: RawPathShape = {
            ty: "sh",
            d: 1,
            ks: {
                a: 1,
                k: [
                    { t: 0, s: [makeBezierSquare(10)] },
                    { t: 30, s: [makeBezierSquare(20)] },
                ],
            },
        } as RawPathShape;

        const box = GetShapesBoundingBox([path as unknown as RawElement]);

        // Uses first keyframe bezier (animated shape properties are not played back at runtime)
        expect(box.width).toBe(10);
        expect(box.height).toBe(10);
    });

    it("handles empty animated path keyframes without crashing", () => {
        const path: RawPathShape = {
            ty: "sh",
            d: 1,
            ks: { a: 1, k: [] },
        } as RawPathShape;

        const box = GetShapesBoundingBox([path as unknown as RawElement]);

        // Empty keyframes produce no vertices — falls back to a zero-size bounding box
        expect(box.width).toBe(0);
        expect(box.height).toBe(0);
        expect(box.offsetX).toBe(0);
        expect(box.offsetY).toBe(0);
        expect(box.centerX).toBe(0);
        expect(box.centerY).toBe(0);
    });
});
