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

    it("computes union bounding box for animated rectangle size", () => {
        const rect = makeAnimatedSizeRect([0, 0], [
            { t: 0, s: [10, 10] },
            { t: 30, s: [50, 50] },
        ]);
        const box = GetShapesBoundingBox([rect as unknown as RawElement]);

        // Union should encompass the largest size
        expect(box.width).toBe(50);
        expect(box.height).toBe(50);
    });

    it("computes union bounding box for animated rectangle with multiple sizes", () => {
        const rect = makeAnimatedSizeRect([0, 0], [
            { t: 0, s: [20, 10] },
            { t: 15, s: [10, 40] },
            { t: 30, s: [30, 20] },
        ]);
        const box = GetShapesBoundingBox([rect as unknown as RawElement]);

        // Union should encompass max width (30) from all sizes and max height (40)
        // Width = max(20, 10, 30) = 30, but the bounding box is center-based:
        // half-widths: 10, 5, 15 → max extent right = 15, left = -15 → width = 30
        // half-heights: 5, 20, 10 → max extent down = 20, up = -20 → height = 40
        expect(box.width).toBe(30);
        expect(box.height).toBe(40);
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

    it("computes union bounding box for animated path", () => {
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

        // Union should encompass the 20x20 square
        expect(box.width).toBe(20);
        expect(box.height).toBe(20);
    });

    it("handles empty animated path keyframes without crashing", () => {
        const path: RawPathShape = {
            ty: "sh",
            d: 1,
            ks: { a: 1, k: [] },
        } as RawPathShape;

        const box = GetShapesBoundingBox([path as unknown as RawElement]);

        // Should not crash; dimensions come from empty corners
        expect(box).toBeDefined();
    });
});
