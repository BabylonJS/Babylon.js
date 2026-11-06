import { Ray } from "core/Culling/ray.core";
import { Vector3 } from "core/Maths/math.vector.pure";
import { describe, expect, it } from "vitest";

describe("Ray.intersectionSegment", () => {
    const segmentAt = (x: number, z = 0): [Vector3, Vector3] => [new Vector3(x, -1, z), new Vector3(x, 1, z)];

    it("respects the ray length", () => {
        const ray = new Ray(Vector3.Zero(), Vector3.Right(), 10);

        expect(ray.intersectionSegment(...segmentAt(5), 0.1)).toBe(5);
        expect(ray.intersectionSegment(...segmentAt(10), 0.1)).toBe(10);
        expect(ray.intersectionSegment(...segmentAt(20), 0.1)).toBe(-1);

        ray.length = 100;
        expect(ray.intersectionSegment(...segmentAt(20), 0.1)).toBe(20);

        const unboundedRay = new Ray(Vector3.Zero(), Vector3.Right());
        expect(unboundedRay.intersectionSegment(...segmentAt(20), 0.1)).toBe(20);
    });

    it("scales the ray extent with non-unit directions", () => {
        const shortDirectionRay = new Ray(Vector3.Zero(), Vector3.Right().scale(0.5), 10);
        expect(shortDirectionRay.intersectionSegment(...segmentAt(5), 0.1)).toBe(5);
        expect(shortDirectionRay.intersectionSegment(...segmentAt(10), 0.1)).toBe(-1);

        const longDirectionRay = new Ray(Vector3.Zero(), Vector3.Right().scale(2), 10);
        expect(longDirectionRay.intersectionSegment(...segmentAt(20), 0.1)).toBe(20);
        expect(longDirectionRay.intersectionSegment(...segmentAt(21), 0.1)).toBe(-1);
    });

    it("accepts collinear and near-parallel segments in either endpoint order", () => {
        const ray = new Ray(Vector3.Zero(), Vector3.Right(), 10);

        // collinear segment that overlaps the ray
        for (const [a, b] of [
            [new Vector3(20, 0, 0), new Vector3(5, 0, 0)],
            [new Vector3(5, 0, 0), new Vector3(20, 0, 0)],
        ]) {
            const distance = ray.intersectionSegment(a, b, 0.1);
            expect(distance).toBeGreaterThanOrEqual(5);
            expect(distance).toBeLessThanOrEqual(10);
        }

        // near-parallel segment whose infinite line crosses the ray line past the ray end (x = 15)
        for (const [a, b] of [
            [new Vector3(5, 0.05, 0), new Vector3(25, -0.05, 0)],
            [new Vector3(25, -0.05, 0), new Vector3(5, 0.05, 0)],
        ]) {
            expect(ray.intersectionSegment(a, b, 0.1)).toBeCloseTo(10, 3);
        }
    });

    it("handles short rays", () => {
        const ray = new Ray(Vector3.Zero(), Vector3.Right(), 0.01);

        expect(ray.intersectionSegment(new Vector3(0.005, -0.001, 0), new Vector3(0.005, 0.001, 0), 0.0001)).toBeCloseTo(0.005, 8);
        expect(ray.intersectionSegment(new Vector3(0.02, -0.001, 0), new Vector3(0.02, 0.001, 0), 0.0001)).toBe(-1);
    });

    it("keeps the projection of the ray end on short collinear segments in either endpoint order", () => {
        const ray = new Ray(Vector3.Zero(), Vector3.Right(), 10);
        const delta = 2 ** -15;

        for (const [a, b] of [
            [new Vector3(10 + delta, 0, 0), new Vector3(10 - delta, 0, 0)],
            [new Vector3(10 - delta, 0, 0), new Vector3(10 + delta, 0, 0)],
        ]) {
            const distance = ray.intersectionSegment(a, b, 1e-6);
            expect(distance).toBeGreaterThanOrEqual(10 - delta);
            expect(distance).toBeLessThanOrEqual(10);
        }
    });

    it("accepts near-parallel short segments that straddle the ray end in either endpoint order", () => {
        // the infinite lines cross past the ray end, at 10 + delta / 2
        const ray = new Ray(Vector3.Zero(), Vector3.Right(), 10);
        const delta = 2 ** -15;
        for (const [a, b] of [
            [new Vector3(10 - delta, -1.5e-4 * delta, 0), new Vector3(10 + delta, 0.5e-4 * delta, 0)],
            [new Vector3(10 + delta, 0.5e-4 * delta, 0), new Vector3(10 - delta, -1.5e-4 * delta, 0)],
        ]) {
            expect(ray.intersectionSegment(a, b, 1e-6)).toBeCloseTo(10, 6);
        }

        // on a short ray the clamped tc numerator (tMax * discriminant) is also below 1e-8
        const shortRay = new Ray(Vector3.Zero(), Vector3.Right(), 0.01);
        for (const [a, b] of [
            [new Vector3(0.0099, -1.5e-8, 0), new Vector3(0.0101, 0.5e-8, 0)],
            [new Vector3(0.0101, 0.5e-8, 0), new Vector3(0.0099, -1.5e-8, 0)],
        ]) {
            expect(shortRay.intersectionSegment(a, b, 1e-6)).toBeCloseTo(0.01, 8);
        }
    });

    it("handles zero-length segments at the ray end", () => {
        const ray = new Ray(Vector3.Zero(), Vector3.Right(), 10);
        const pointAt = (x: number, y = 0): [Vector3, Vector3] => [new Vector3(x, y, 0), new Vector3(x, y, 0)];

        expect(ray.intersectionSegment(...pointAt(10), 1e-6)).toBe(10);
        // past the ray end but within the threshold
        expect(ray.intersectionSegment(...pointAt(10 + 1e-7), 1e-6)).toBeCloseTo(10, 6);
        expect(ray.intersectionSegment(...pointAt(10.001), 1e-6)).toBe(-1);
        expect(ray.intersectionSegment(...pointAt(10, 0.001), 1e-6)).toBe(-1);
    });

    it("rejects segments behind the ray and applies the threshold", () => {
        const ray = new Ray(Vector3.Zero(), Vector3.Right(), 10);

        expect(ray.intersectionSegment(...segmentAt(-5), 0.1)).toBe(-1);
        expect(ray.intersectionSegment(...segmentAt(5), 0)).toBe(-1);
        expect(ray.intersectionSegment(...segmentAt(5, 0.05), 0.01)).toBe(-1);
        expect(ray.intersectionSegment(...segmentAt(5, 0.05), 0.1)).toBeCloseTo(Math.sqrt(5 * 5 + 0.05 * 0.05));
    });
});
