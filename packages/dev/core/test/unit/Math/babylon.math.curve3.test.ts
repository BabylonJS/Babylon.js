import { describe, expect, it } from "vitest";
import { Curve3, Path3D } from "../../../src/Maths/math.path";
import { Vector3 } from "../../../src/Maths/math.vector";

describe("Curve3.ArcThru3Points", () => {
    const first = new Vector3(1, 0, 0);
    const second = new Vector3(0, 1, 0);
    const third = new Vector3(-1, 0, 0);

    it("makes a full circle of steps segments that ends on its first point", () => {
        for (let steps = 3; steps <= 64; steps++) {
            const points = Curve3.ArcThru3Points(first, second, third, steps, false, true).getPoints();

            expect(points.length).toBe(steps + 1);
            // Both endpoints are exact clones of first, not trig reconstructions.
            expect(points[0].equals(first)).toBe(true);
            expect(points[points.length - 1].equals(first)).toBe(true);
            // every segment has the same length, including the one that closes the circle
            const segment = 2 * Math.sin(Math.PI / steps);
            for (let i = 1; i < points.length; i++) {
                expect(Vector3.Distance(points[i - 1], points[i])).toBeCloseTo(segment, 10);
            }
        }
    });

    it("returns a one-point arc for zero steps without throwing", () => {
        const points = Curve3.ArcThru3Points(first, second, third, 0, false, true).getPoints();
        expect(points.length).toBe(1);
        expect(points[0].equals(first)).toBe(true);
    });

    it("keeps a closing sample and a tangent frame for positive step counts below one", () => {
        for (const steps of [0.5, 0.999]) {
            const points = Curve3.ArcThru3Points(first, second, third, steps, false, true).getPoints();
            expect(points.length).toBe(2);
            expect(points[0].equals(first)).toBe(true);
            expect(points[1].equals(first)).toBe(true);
            expect(points[0]).not.toBe(points[1]);

            const path = new Path3D(points);
            expect(path.getTangents().length).toBe(2);
            expect(path.getTangents()[0]).toBeDefined();
            expect(path.getNormals()[0]).toBeDefined();
        }
    });
});
