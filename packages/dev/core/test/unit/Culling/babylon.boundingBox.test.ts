import { BoundingBox } from "core/Culling";
import { Frustum, Matrix, Plane, Vector3 } from "core/Maths";

describe("Babylon BoundingBox", function () {
    describe("_update", function () {
        // Reference: transform each local corner with the public vector helpers and accumulate the extents.
        const expectWorldDataToMatchReference = (box: BoundingBox, world: Matrix) => {
            const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (let index = 0; index < 8; ++index) {
                const corner = Vector3.TransformCoordinates(box.vectors[index], world);
                expect(box.vectorsWorld[index].asArray()).toEqual(corner.asArray());
                minimum.minimizeInPlace(corner);
                maximum.maximizeInPlace(corner);
            }
            expect(box.minimumWorld.asArray()).toEqual(minimum.asArray());
            expect(box.maximumWorld.asArray()).toEqual(maximum.asArray());
            expect(box.extendSizeWorld.asArray()).toEqual(maximum.subtract(minimum).scale(0.5).asArray());
            expect(box.centerWorld.asArray()).toEqual(maximum.add(minimum).scale(0.5).asArray());
            expect(box.directions[0].asArray()).toEqual([world.m[0], world.m[1], world.m[2]]);
            expect(box.directions[1].asArray()).toEqual([world.m[4], world.m[5], world.m[6]]);
            expect(box.directions[2].asArray()).toEqual([world.m[8], world.m[9], world.m[10]]);
        };

        it("should match the corner-by-corner transform for an affine world matrix", function () {
            const world = Matrix.Compose(
                new Vector3(1.5, -2, 0.25),
                Vector3.Zero().toQuaternion().copyFromFloats(0.1825742, 0.3651484, 0.5477226, 0.7302967),
                new Vector3(3, -4, 5)
            );
            const box = new BoundingBox(new Vector3(-1, -2, -3), new Vector3(4, 5, 6), world);

            expectWorldDataToMatchReference(box, world);
        });

        it("should apply the perspective divide of a projective world matrix", function () {
            const world = Matrix.PerspectiveFovLH(0.8, 16 / 9, 0.1, 100).multiply(Matrix.Translation(0, 0, 3));
            const box = new BoundingBox(new Vector3(-1, -1, 1), new Vector3(1, 1, 2), world);

            expectWorldDataToMatchReference(box, world);
        });

        it("should copy the local data for an identity world matrix", function () {
            const box = new BoundingBox(new Vector3(-1, -2, -3), new Vector3(4, 5, 6), Matrix.Scaling(2, 2, 2));

            box._update(Matrix.Identity());

            for (let index = 0; index < 8; ++index) {
                expect(box.vectorsWorld[index].asArray()).toEqual(box.vectors[index].asArray());
            }
            expect(box.minimumWorld.asArray()).toEqual([-1, -2, -3]);
            expect(box.maximumWorld.asArray()).toEqual([4, 5, 6]);
        });
    });

    describe("isInFrustum", function () {
        it("should agree with a plane-by-plane test of the world corners", function () {
            const planes = Frustum.GetPlanes(Matrix.LookAtLH(new Vector3(0, 0, -10), Vector3.Zero(), Vector3.Up()).multiply(Matrix.PerspectiveFovLH(0.8, 1, 0.1, 100)));
            const reference = (box: BoundingBox) =>
                planes.every((plane: Plane) => box.vectorsWorld.some((corner) => plane.normal.x * corner.x + plane.normal.y * corner.y + plane.normal.z * corner.z + plane.d >= 0));

            for (const x of [-40, -6, 0, 6, 40]) {
                for (const z of [-20, 0, 50, 200]) {
                    const box = new BoundingBox(new Vector3(-1, -1, -1), new Vector3(1, 1, 1), Matrix.Translation(x, 0, z));
                    expect(box.isInFrustum(planes)).toBe(reference(box));
                }
            }
        });
    });
});
