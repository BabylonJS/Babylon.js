import { Nullable } from "babylonjs/types";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { Epsilon } from 'babylonjs/Maths/math.constants';

/**
 * Class used to transport Vector2 information for pointer events
 */
export class Vector2WithInfo extends Vector2 {
    /**
     * Creates a new Vector2WithInfo
     * @param source defines the vector2 data to transport
     * @param buttonIndex defines the current mouse button index
     */
    public constructor(source: Vector2,
        /** defines the current mouse button index */
        public buttonIndex: number = 0) {
        super(source.x, source.y);
    }
}

/** Class used to provide 2D matrix features */
export class Matrix2D {
    /** Gets the internal array of 6 floats used to store matrix data */
    public m = new Float32Array(6);

    /**
     * Creates a new matrix
     * @param m00 defines value for (0, 0)
     * @param m01 defines value for (0, 1)
     * @param m10 defines value for (1, 0)
     * @param m11 defines value for (1, 1)
     * @param m20 defines value for (2, 0)
     * @param m21 defines value for (2, 1)
     */
    constructor(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number) {
        this.fromValues(m00, m01, m10, m11, m20, m21);
    }

    /**
     * Fills the matrix from direct values
     * @param m00 defines value for (0, 0)
     * @param m01 defines value for (0, 1)
     * @param m10 defines value for (1, 0)
     * @param m11 defines value for (1, 1)
     * @param m20 defines value for (2, 0)
     * @param m21 defines value for (2, 1)
     * @returns the current modified matrix
     */
    public fromValues(m00: number, m01: number, m10: number, m11: number, m20: number, m21: number): Matrix2D {
        this.m[0] = m00; this.m[1] = m01;
        this.m[2] = m10; this.m[3] = m11;
        this.m[4] = m20; this.m[5] = m21;
        return this;
    }

    /**
     * Gets matrix determinant
     * @returns the determinant
     */
    public determinant(): number {
        return this.m[0] * this.m[3] - this.m[1] * this.m[2];
    }

    /**
     * Inverses the matrix and stores it in a target matrix
     * @param result defines the target matrix
     * @returns the current matrix
     */
    public invertToRef(result: Matrix2D): Matrix2D {
        let l0 = this.m[0]; let l1 = this.m[1];
        let l2 = this.m[2]; let l3 = this.m[3];
        let l4 = this.m[4]; let l5 = this.m[5];

        let det = this.determinant();
        if (det < (Epsilon * Epsilon)) {
            result.m[0] = 0; result.m[1] = 0;
            result.m[2] = 0; result.m[3] = 0;
            result.m[4] = 0; result.m[5] = 0;
            return this;
        }

        let detDiv = 1 / det;

        let det4 = l2 * l5 - l3 * l4;
        let det5 = l1 * l4 - l0 * l5;

        result.m[0] = l3 * detDiv; result.m[1] = -l1 * detDiv;
        result.m[2] = -l2 * detDiv; result.m[3] = l0 * detDiv;
        result.m[4] = det4 * detDiv; result.m[5] = det5 * detDiv;

        return this;
    }

    /**
     * Multiplies the current matrix with another one
     * @param other defines the second operand
     * @param result defines the target matrix
     * @returns the current matrix
     */
    public multiplyToRef(other: Matrix2D, result: Matrix2D): Matrix2D {
        let l0 = this.m[0]; let l1 = this.m[1];
        let l2 = this.m[2]; let l3 = this.m[3];
        let l4 = this.m[4]; let l5 = this.m[5];

        let r0 = other.m[0]; let r1 = other.m[1];
        let r2 = other.m[2]; let r3 = other.m[3];
        let r4 = other.m[4]; let r5 = other.m[5];

        result.m[0] = l0 * r0 + l1 * r2; result.m[1] = l0 * r1 + l1 * r3;
        result.m[2] = l2 * r0 + l3 * r2; result.m[3] = l2 * r1 + l3 * r3;
        result.m[4] = l4 * r0 + l5 * r2 + r4; result.m[5] = l4 * r1 + l5 * r3 + r5;

        return this;
    }

    /**
     * Applies the current matrix to a set of 2 floats and stores the result in a vector2
     * @param x defines the x coordinate to transform
     * @param y defines the x coordinate to transform
     * @param result defines the target vector2
     * @returns the current matrix
     */
    public transformCoordinates(x: number, y: number, result: Vector2): Matrix2D {
        result.x = x * this.m[0] + y * this.m[2] + this.m[4];
        result.y = x * this.m[1] + y * this.m[3] + this.m[5];

        return this;
    }

    // Statics
    /**
     * Creates an identity matrix
     * @returns a new matrix
     */
    public static Identity(): Matrix2D {
        return new Matrix2D(1, 0, 0, 1, 0, 0);
    }

    /**
     * Creates a translation matrix and stores it in a target matrix
     * @param x defines the x coordinate of the translation
     * @param y defines the y coordinate of the translation
     * @param result defines the target matrix
     */
    public static TranslationToRef(x: number, y: number, result: Matrix2D): void {
        result.fromValues(1, 0, 0, 1, x, y);
    }

    /**
     * Creates a scaling matrix and stores it in a target matrix
     * @param x defines the x coordinate of the scaling
     * @param y defines the y coordinate of the scaling
     * @param result defines the target matrix
     */
    public static ScalingToRef(x: number, y: number, result: Matrix2D): void {
        result.fromValues(x, 0, 0, y, 0, 0);
    }

    /**
     * Creates a rotation matrix and stores it in a target matrix
     * @param angle defines the rotation angle
     * @param result defines the target matrix
     */
    public static RotationToRef(angle: number, result: Matrix2D): void {
        var s = Math.sin(angle);
        var c = Math.cos(angle);

        result.fromValues(c, s, -s, c, 0, 0);
    }

    private static _TempPreTranslationMatrix = Matrix2D.Identity();
    private static _TempPostTranslationMatrix = Matrix2D.Identity();
    private static _TempRotationMatrix = Matrix2D.Identity();
    private static _TempScalingMatrix = Matrix2D.Identity();
    private static _TempCompose0 = Matrix2D.Identity();
    private static _TempCompose1 = Matrix2D.Identity();
    private static _TempCompose2 = Matrix2D.Identity();

    /**
     * Composes a matrix from translation, rotation, scaling and parent matrix and stores it in a target matrix
     * @param tx defines the x coordinate of the translation
     * @param ty defines the y coordinate of the translation
     * @param angle defines the rotation angle
     * @param scaleX defines the x coordinate of the scaling
     * @param scaleY defines the y coordinate of the scaling
     * @param parentMatrix defines the parent matrix to multiply by (can be null)
     * @param result defines the target matrix
     */
    public static ComposeToRef(tx: number, ty: number, angle: number, scaleX: number, scaleY: number, parentMatrix: Nullable<Matrix2D>, result: Matrix2D): void {
        Matrix2D.TranslationToRef(tx, ty, Matrix2D._TempPreTranslationMatrix);

        Matrix2D.ScalingToRef(scaleX, scaleY, Matrix2D._TempScalingMatrix);

        Matrix2D.RotationToRef(angle, Matrix2D._TempRotationMatrix);

        Matrix2D.TranslationToRef(-tx, -ty, Matrix2D._TempPostTranslationMatrix);

        Matrix2D._TempPreTranslationMatrix.multiplyToRef(Matrix2D._TempScalingMatrix, Matrix2D._TempCompose0);
        Matrix2D._TempCompose0.multiplyToRef(Matrix2D._TempRotationMatrix, Matrix2D._TempCompose1);
        if (parentMatrix) {
            Matrix2D._TempCompose1.multiplyToRef(Matrix2D._TempPostTranslationMatrix, Matrix2D._TempCompose2);
            Matrix2D._TempCompose2.multiplyToRef(parentMatrix, result);
        } else {
            Matrix2D._TempCompose1.multiplyToRef(Matrix2D._TempPostTranslationMatrix, result);
        }
    }
}