import { Plane, Vector3 } from "core/Maths";
import { BabylonMathVectorGetAngleBetweenVectorsOnPlaneTestCases } from "./babylon.math.vector.get-angle-between-vectors-on-plane.test-cases";

/**
 * Describes the test suite.
 */
describe("Babylon Vectors", () => {
    describe("#Vector3", () => {
        it("can project from an origin onto a plane", () => {
            // A ground plane at origin
            const simplePlane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up());

            const rayOrigin = new Vector3(0, 10, 0);
            const rayGoingThrough = new Vector3(1, 8, 0);

            // Going left 1 unit for each 2 units downs
            const expected = new Vector3(5, 0, 0);

            expect(rayGoingThrough.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected);
        });

        it("can project from an origin onto an offset plane", () => {
            // A ground plane 10 units below origin
            const simplePlane = Plane.FromPositionAndNormal(new Vector3(0, -10, 0), Vector3.Up());

            const rayOrigin = new Vector3(0, 10, 0);
            const rayGoingThrough = new Vector3(1, 8, 0);

            // Going left 1 unit for each 2 units downs
            const expected = new Vector3(10, -10, 0);

            expect(rayGoingThrough.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected);
        });

        it("can project parallel to a plane", () => {
            // A ground plane 10 units below origin
            const simplePlane = Plane.FromPositionAndNormal(new Vector3(0, 0, 0), Vector3.Up());

            const rayOrigin = new Vector3(0, 10, 0);
            const rayGoingThrough = new Vector3(10, 10, 0);

            // Going parallel to the plane should return infinity
            const expected = new Vector3(Infinity, Infinity, Infinity);

            expect(rayGoingThrough.projectOnPlane(simplePlane, rayOrigin)).toEqual(expected);
        });

        describe("can get angle between vectors on a plane", () => {
            BabylonMathVectorGetAngleBetweenVectorsOnPlaneTestCases.forEach(({ v0, v1, normal, result }, index) => {
                const v0Vector = new Vector3(v0.x, v0.y, v0.z);
                const v1Vector = new Vector3(v1.x, v1.y, v1.z);
                const normalVector = new Vector3(normal.x, normal.y, normal.z);

                it("check GetAngleBetweenVectorsOnPlane test case " + index, () => {
                    const calculatedResult = Vector3.GetAngleBetweenVectorsOnPlane(v0Vector, v1Vector, normalVector);
                    expect(calculatedResult).toBeCloseTo(result, 8);
                });
            });
        });
    });
});
