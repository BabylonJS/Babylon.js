import { Effect } from "core/Materials/effect";
import { FloatingOriginCurrentScene, OverrideMatrixFunctions, ResetMatrixFunctions } from "core/Materials/floatingOriginMatrixOverrides";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";

describe("Floating origin matrix overrides", () => {
    const offset = new Vector3(100, 20, -300);
    const originalGetScene = FloatingOriginCurrentScene.getScene;

    beforeEach(() => {
        OverrideMatrixFunctions();
        FloatingOriginCurrentScene.getScene = () => ({ floatingOriginOffset: offset }) as any;
    });

    afterEach(() => {
        ResetMatrixFunctions();
        FloatingOriginCurrentScene.getScene = originalGetScene;
    });

    // The world matrix as the floating origin override hands it on to the effect
    function offsetWorld(world: Matrix): Matrix {
        let sent: Matrix | null = null;
        const effect = Object.create(Effect.prototype);
        effect._setMatrixOverride = (_name: string, matrix: Matrix) => {
            sent = Matrix.FromArray(matrix.asArray());
        };
        effect.setMatrix("world", world);
        return sent!;
    }

    // Where the world matrix places each corner of a cube round the origin, less the offset, and where the offset matrix
    // places it: the two should match
    function placedCorners(world: Matrix): Array<[Vector3, Vector3]> {
        const offsetMatrix = offsetWorld(world);
        const corners: Array<[Vector3, Vector3]> = [];
        for (const x of [-1, 1]) {
            for (const y of [-1, 1]) {
                for (const z of [-1, 1]) {
                    const point = new Vector3(x, y, z);
                    corners.push([Vector3.TransformCoordinates(point, world).subtract(offset), Vector3.TransformCoordinates(point, offsetMatrix)]);
                }
            }
        }
        return corners;
    }

    it("offsets an affine world matrix", () => {
        const world = Matrix.Compose(new Vector3(2, 3, 4), Quaternion.RotationYawPitchRoll(0.3, 0.2, 0.1), new Vector3(5, 30, 7));
        for (const [expected, actual] of placedCorners(world)) {
            expect(actual.asArray()).toEqual(expected.asArray().map((n) => expect.closeTo(n, 4)));
        }
    });

    // A projective world matrix, as CameraGizmo uses to draw a camera's frustum: the inverse of its projection
    // (see CameraGizmo._update)
    it("offsets a projective world matrix, such as a camera frustum's", () => {
        const inverseProjection = Matrix.Invert(Matrix.PerspectiveFovLH(0.8, 1.5, 0.5, 10));
        const world = inverseProjection.multiply(Matrix.RotationX(1.2)).multiply(Matrix.Translation(5, 30, 7));
        for (const [expected, actual] of placedCorners(world)) {
            expect(actual.asArray()).toEqual(expected.asArray().map((n) => expect.closeTo(n, 4)));
        }
    });
});
