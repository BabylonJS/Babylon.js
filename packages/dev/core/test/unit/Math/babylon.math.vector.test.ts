import { Plane, Vector3 } from 'core/Maths'

/**
 * Describes the test suite.
 */
describe("Babylon Vectors", () => {
    describe("#Vector3", () => {
        it("can project a direction vector onto a plane", () => {
            // A ground plane at origin
            const simplePlane = Plane.FromPositionAndNormal(
                Vector3.Zero(),
                Vector3.Up(),
            );

            const rayOrigin = new Vector3(0, 10, 0);
            const rayAngle = new Vector3(0.5, -0.5, 0);

            /*
             * At 45 degrees this should form a perfect right triangle,
             * so the result should be the same as the distance to the origin.
             */
            const expected = new Vector3(10, 0, 0);

            expect(rayAngle.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected)
        })

        it("can project a direction vector onto an offset plane", () => {
            // A ground plane 10 units below origin
            const simplePlane = Plane.FromPositionAndNormal(
                new Vector3(0, -10, 0),
                Vector3.Up(),
            );

            const rayOrigin = new Vector3(0, 10, 0);
            const rayAngle = new Vector3(0.5, -0.5, 0);

            // This is also a right triangle, but the plane is offset so the hit point is offset and the distance increases
            const expected = new Vector3(20, -10, 0);

            expect(rayAngle.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected)
        })
    })
})