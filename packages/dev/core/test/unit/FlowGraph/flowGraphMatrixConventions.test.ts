import { Matrix, Vector2, Vector3 } from "core/Maths/math.vector";
import { FlowGraphMatrix2D, FlowGraphMatrix3D } from "core/FlowGraph/CustomTypes/flowGraphMatrix";

/**
 * `FlowGraphMatrix2D` and `FlowGraphMatrix3D` are the 2x2 and 3x3 counterparts of Babylon's 4x4
 * `Matrix`, and must follow the same conventions: column-major storage, and `x.multiply(y)`
 * meaning "apply x, then y".
 */
describe("FlowGraph matrix conventions", () => {
    it("matches Babylon Matrix multiplication order", () => {
        // Two distinct scale/translation transforms, expressed as both a 4x4 and a 3x3.
        const scale = Matrix.FromArray([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1]);
        const translate = Matrix.FromArray([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1]);

        // Babylon: x.multiply(y) applies x first, then y.
        const scaleThenTranslate = scale.multiply(translate);
        const point = Vector3.TransformCoordinates(new Vector3(1, 0, 0), scaleThenTranslate);
        expect(point.x).toBe(7); // 1 * 2 + 5

        // The other order must differ, confirming the operands are not commutative here.
        const translateThenScale = translate.multiply(scale);
        expect(Vector3.TransformCoordinates(new Vector3(1, 0, 0), translateThenScale).x).toBe(12); // (1 + 5) * 2
    });

    it("applies FlowGraphMatrix3D multiplication in the same order as Babylon", () => {
        // Column-major 3x3 equivalents of the transforms above (2D affine in a 3x3).
        const scale = new FlowGraphMatrix3D([2, 0, 0, 0, 2, 0, 0, 0, 1]);
        const translate = new FlowGraphMatrix3D([1, 0, 0, 0, 1, 0, 5, 0, 1]);

        const scaleThenTranslate = scale.multiply(translate);
        // Column-major M*v for the homogeneous point (1, 0, 1).
        const transformed = scaleThenTranslate.transformVector(new Vector3(1, 0, 1));
        expect(transformed.x).toBe(7);

        const translateThenScale = translate.multiply(scale);
        expect(translateThenScale.transformVector(new Vector3(1, 0, 1)).x).toBe(12);
    });

    it("applies FlowGraphMatrix2D multiplication in the same order as Babylon", () => {
        // Column-major 2x2: a scale and a shear, which do not commute.
        // scale = [[2,0],[0,3]], shear = [[1,1],[0,1]].
        const scale = new FlowGraphMatrix2D([2, 0, 0, 3]);
        const shear = new FlowGraphMatrix2D([1, 0, 1, 1]);

        // scale.multiply(shear) applies the scale first, i.e. column-major shear * scale
        // = [[1,1],[0,1]] * [[2,0],[0,3]] = [[2,3],[0,3]], stored column-major as [2,0,3,3].
        expect(Array.from(scale.multiply(shear).m)).toEqual([2, 0, 3, 3]);
        // The reverse order applies the shear first: scale * shear = [[2,2],[0,3]] => [2,0,2,3].
        expect(Array.from(shear.multiply(scale).m)).toEqual([2, 0, 2, 3]);
    });

    it("keeps transformVector consistent with multiplication", () => {
        const a = new FlowGraphMatrix2D([2, 0, 0, 3]);
        const b = new FlowGraphMatrix2D([1, 0, 1, 1]);

        // Applying a then b must equal transforming by a.multiply(b).
        const stepwise = b.transformVector(a.transformVector(new Vector2(1, 1)));
        const combined = a.multiply(b).transformVector(new Vector2(1, 1));

        expect(combined.x).toBeCloseTo(stepwise.x, 10);
        expect(combined.y).toBeCloseTo(stepwise.y, 10);
    });
});
