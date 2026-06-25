import { describe, expect, it } from "vitest";
import { Vector3 } from "core/Maths/math.vector";
import { computeFBXGeometricMatrix, computeFBXLocalMatrix, eulerToMatrix, eulerToMatrixXYZ } from "loaders/FBX/interpreter/transform";

describe("FBX transform evaluator", () => {
    it("keeps XYZ rotation order equivalent to the explicit XYZ helper", () => {
        const d2r = Math.PI / 180;
        const ordered = eulerToMatrix(10 * d2r, 20 * d2r, 30 * d2r, 0).asArray();
        const xyz = eulerToMatrixXYZ(10 * d2r, 20 * d2r, 30 * d2r).asArray();

        expect(ordered).toEqual(xyz);
    });

    it("computes the existing row-vector local transform chain", () => {
        const matrix = computeFBXLocalMatrix({
            translation: [10, 0, 0],
            rotation: [0, 0, 90],
            scale: [2, 1, 1],
            preRotation: [0, 0, 0],
            postRotation: [0, 0, 0],
            rotationPivot: [0, 0, 0],
            scalingPivot: [0, 0, 0],
            rotationOffset: [0, 0, 0],
            scalingOffset: [0, 0, 0],
            rotationOrder: 0,
        });

        const transformed = Vector3.TransformCoordinates(Vector3.Right(), matrix);

        expect(transformed.x).toBeCloseTo(10, 6);
        expect(transformed.y).toBeCloseTo(2, 6);
        expect(transformed.z).toBeCloseTo(0, 6);
    });

    it("keeps geometric translation after rotation and scale", () => {
        const matrix = computeFBXGeometricMatrix([10, 0, 0], [0, 0, 90], [2, 1, 1]);
        const transformed = Vector3.TransformCoordinates(Vector3.Right(), matrix);

        expect(transformed.x).toBeCloseTo(10, 6);
        expect(transformed.y).toBeCloseTo(2, 6);
        expect(transformed.z).toBeCloseTo(0, 6);
    });
});
