import type { IMatrixLike, IVector2Like } from "core/Maths/math.like";
import type { Tuple } from "core/types";

/**
 * Represents a Babylon.js thin version of a Matrix
 * We are only exposing what we truly need in the scope of
 * the Lottie Renderer project preventing the dependency on the full
 * Babylon.js math system.
 */
export class ThinMatrix implements IMatrixLike {
    /**
     * Prevents global conflicts on update as shader programs are shared.
     */
    private static _UPDATE_FLAG_SEED = 0;

    /**
     * Current update flag used to know whether a Matrix has changed since previous render or not.
     * This helps identifying if a Matrix needs to be
     * uploaded to a shader program.
     */
    public updateFlag = -1;

    private readonly _data: Float32Array;

    /**
     * Creates a new ThinMatrix instance.
     */
    public constructor() {
        this._data = new Float32Array(16);
    }

    /**
     * Set the matrix values.
     * @param m11 Value for row 1, column 1
     * @param m12 Value for row 1, column 2
     * @param m13 Value for row 1, column 3
     * @param m14 Value for row 1, column 4
     * @param m21 Value for row 2, column 1
     * @param m22 Value for row 2, column 2
     * @param m23 Value for row 2, column 3
     * @param m24 Value for row 2, column 4
     * @param m31 Value for row 3, column 1
     * @param m32 Value for row 3, column 2
     * @param m33 Value for row 3, column 3
     * @param m34 Value for row 3, column 4
     * @param m41 Value for row 4, column 1
     * @param m42 Value for row 4, column 2
     * @param m43 Value for row 4, column 3
     * @param m44 Value for row 4, column 4
     * @returns The updated ThinMatrix instance
     */
    public setValues(
        m11: number,
        m12: number,
        m13: number,
        m14: number,
        m21: number,
        m22: number,
        m23: number,
        m24: number,
        m31: number,
        m32: number,
        m33: number,
        m34: number,
        m41: number,
        m42: number,
        m43: number,
        m44: number
    ): ThinMatrix {
        const m = this._data;
        m[0] = m11;
        m[1] = m12;
        m[2] = m13;
        m[3] = m14;
        m[4] = m21;
        m[5] = m22;
        m[6] = m23;
        m[7] = m24;
        m[8] = m31;
        m[9] = m32;
        m[10] = m33;
        m[11] = m34;
        m[12] = m41;
        m[13] = m42;
        m[14] = m43;
        m[15] = m44;

        this.updateFlag = ThinMatrix._UPDATE_FLAG_SEED++;

        return this;
    }

    /**
     * Set the matrix to an identity matrix.
     * @returns The updated ThinMatrix instance
     */
    public identity(): ThinMatrix {
        this.setValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

        return this;
    }

    /**
     * Stores a left-handed orthographic projection into a given matrix
     * @param left defines the viewport left coordinate
     * @param right defines the viewport right coordinate
     * @param bottom defines the viewport bottom coordinate
     * @param top defines the viewport top coordinate
     * @param znear defines the near clip plane
     * @param zfar defines the far clip plane
     * @returns The updated ThinMatrix instance
     */
    public orthoOffCenterLeftHanded(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): ThinMatrix {
        const n = znear;
        const f = zfar;

        const a = 2.0 / (right - left);
        const b = 2.0 / (top - bottom);
        const c = 2.0 / (f - n);
        const d = -(f + n) / (f - n);
        const i0 = (left + right) / (left - right);
        const i1 = (top + bottom) / (bottom - top);

        this.setValues(a, 0.0, 0.0, 0.0, 0.0, b, 0.0, 0.0, 0.0, 0.0, c, 0.0, i0, i1, d, 1.0);

        return this;
    }

    /**
     * Sets a matrix to a value composed by merging scale (vector2), rotation (roll around z) and translation (vector2)
     * This only updates the parts of the matrix that are used for 2D transformations.
     * @param scale defines the scale vector
     * @param roll defines the rotation around z
     * @param translation defines the translation vector
     * @returns the updated ThinMatrix instance
     */
    public compose(scale: IVector2Like, roll: number, translation: IVector2Like): ThinMatrix {
        // Produces a quaternion from Euler angles in the z-y-x orientation (Tait-Bryan angles)
        const halfRoll = roll * 0.5;
        const z = Math.sin(halfRoll),
            w = Math.cos(halfRoll);

        const z2 = z + z;
        const zz = z * z2;
        const wz = w * z2;

        const sx = scale.x,
            sy = scale.y;

        const m = this._data;
        m[0] = (1 - zz) * sx;
        m[1] = wz * sx;

        m[4] = -wz * sy;
        m[5] = (1 - zz) * sy;

        m[12] = translation.x;
        m[13] = translation.y;

        return this;
    }

    /**
     * Sets the current matrix with the multiplication result of the current Matrix and the given one
     * This only updates the parts of the matrix that are used for 2D transformations.
     * @param other defines the second operand
     * @param output the matrix to store the result in
     * @returns the current matrix
     */
    public multiplyToRef(other: ThinMatrix, output: ThinMatrix): ThinMatrix {
        const m = this._data;
        const otherM = other._data;

        // Only calculate the values we actually use (2D transform)
        const tm0 = m[0],
            tm1 = m[1],
            tm4 = m[4],
            tm5 = m[5];
        const tm12 = m[12],
            tm13 = m[13];

        const om0 = otherM[0],
            om1 = otherM[1];
        const om4 = otherM[4],
            om5 = otherM[5];
        const om12 = otherM[12],
            om13 = otherM[13];

        // Only update the 2D transformation parts
        output._data[0] = tm0 * om0 + tm1 * om4;
        output._data[1] = tm0 * om1 + tm1 * om5;
        output._data[4] = tm4 * om0 + tm5 * om4;
        output._data[5] = tm4 * om1 + tm5 * om5;
        output._data[12] = tm12 * om0 + tm13 * om4 + om12;
        output._data[13] = tm12 * om1 + tm13 * om5 + om13;

        return this;
    }

    /**
     * Returns the matrix data array.
     * @returns The matrix data
     */
    public asArray(): Tuple<number, 16> {
        return this._data as any as Tuple<number, 16>;
    }

    /**
     * Decomposes the matrix into scale, rotation, and translation.
     * @param scale Scale vector to store the scale values
     * @param translation Translation vector to store the translation values
     * @returns The rotation in radians
     */
    public decompose(scale: IVector2Like, translation: IVector2Like): number {
        const m00 = this._data[0]; // scaleX * cos(θ)
        const m01 = this._data[1]; // -scaleY * sin(θ)
        const m10 = this._data[4]; // scaleX * sin(θ)
        const m11 = this._data[5]; // scaleY * cos(θ)

        // Extract scale
        scale.x = Math.hypot(m00, m10); // sqrt(m00² + m10²)
        scale.y = Math.hypot(m01, m11); // sqrt(m01² + m11²)

        // Extract rotation (assumes uniform scaling or affine 2D)
        const rotation = Math.atan2(m10, m00); // θ from the first column

        // Extract the translation
        translation.x = this._data[12];
        translation.y = this._data[13];

        return rotation;
    }
}
