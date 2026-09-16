import { BoundingSphere } from "core/Culling";
import { Vector3 } from "core/Maths";

describe("Babylon BoundingSphere", function () {
    describe("scale", function () {
        it("should scale the radius by exactly the given factor", function () {
            const sphere = new BoundingSphere(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
            const originalRadius = sphere.radius;

            sphere.scale(2);

            expect(sphere.radius).toBeCloseTo(originalRadius * 2, 6);
        });

        it("should preserve the center", function () {
            const sphere = new BoundingSphere(new Vector3(2, 4, 6), new Vector3(4, 8, 12));
            const center = sphere.center.clone();

            sphere.scale(3);

            expect(sphere.center.x).toBeCloseTo(center.x, 6);
            expect(sphere.center.y).toBeCloseTo(center.y, 6);
            expect(sphere.center.z).toBeCloseTo(center.z, 6);
        });

        it("should shrink the radius for factors below one", function () {
            const sphere = new BoundingSphere(new Vector3(-4, -4, -4), new Vector3(4, 4, 4));
            const originalRadius = sphere.radius;

            sphere.scale(0.5);

            expect(sphere.radius).toBeCloseTo(originalRadius * 0.5, 6);
        });

        it("should remain finite for a degenerate sphere", function () {
            const point = new Vector3(1, 2, 3);
            const sphere = new BoundingSphere(point, point);

            sphere.scale(2);

            expect(sphere.radius).toBe(0);
            expect(sphere.center.x).toBeCloseTo(1, 6);
            expect(sphere.center.y).toBeCloseTo(2, 6);
            expect(sphere.center.z).toBeCloseTo(3, 6);
        });
    });
});
