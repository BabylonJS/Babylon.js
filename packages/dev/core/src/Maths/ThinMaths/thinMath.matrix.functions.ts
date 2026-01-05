/* eslint-disable @typescript-eslint/naming-convention */
import type { DeepImmutable } from "core/types";
import type { IMatrixLike } from "../math.like";

/** @internal */
export class MatrixManagement {
    /** @internal */
    static _UpdateFlagSeed = 0;
}

function SetMatrixData(
    result: IMatrixLike,
    m0: number,
    m1: number,
    m2: number,
    m3: number,
    m4: number,
    m5: number,
    m6: number,
    m7: number,
    m8: number,
    m9: number,
    m10: number,
    m11: number,
    m12: number,
    m13: number,
    m14: number,
    m15: number
): void {
    const mat = result.asArray();
    mat[0] = m0;
    mat[1] = m1;
    mat[2] = m2;
    mat[3] = m3;
    mat[4] = m4;
    mat[5] = m5;
    mat[6] = m6;
    mat[7] = m7;
    mat[8] = m8;
    mat[9] = m9;
    mat[10] = m10;
    mat[11] = m11;
    mat[12] = m12;
    mat[13] = m13;
    mat[14] = m14;
    mat[15] = m15;

    MarkAsDirty(result);
}

/**
 * Marks the given matrix as dirty
 * @param matrix defines the matrix to mark as dirty
 */
export function MarkAsDirty(matrix: IMatrixLike): void {
    matrix.updateFlag = MatrixManagement._UpdateFlagSeed++;
}

/**
 * Sets the given matrix to the identity matrix
 * @param result defines the target matrix
 */
export function IdentityMatrixToRef(result: IMatrixLike): void {
    SetMatrixData(result, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
}

/**
 * Creates a new translation matrix.
 * @param x defines the x coordinate
 * @param y defines the y coordinate
 * @param z defines the z coordinate
 * @param result defines the target matrix
 */
export function TranslationMatrixToRef(x: number, y: number, z: number, result: IMatrixLike): void {
    SetMatrixData(result, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, x, y, z, 1.0);
}

/**
 * Creates a new scaling matrix.
 * @param x defines the scale factor on X axis
 * @param y defines the scale factor on Y axis
 * @param z defines the scale factor on Z axis
 * @param result defines the target matrix
 */
export function ScalingMatrixToRef(x: number, y: number, z: number, result: IMatrixLike): void {
    SetMatrixData(result, x, 0.0, 0.0, 0.0, 0.0, y, 0.0, 0.0, 0.0, 0.0, z, 0.0, 0.0, 0.0, 0.0, 1.0);
}

/**
 * Multiplies two matrices and stores the result in the target array.
 * @param a defines the first matrix
 * @param b defines the second matrix
 * @param output defines the target array
 * @param offset defines the offset in the target array where to store the result (0 by default)
 */
export function MultiplyMatricesToArray(a: DeepImmutable<IMatrixLike>, b: DeepImmutable<IMatrixLike>, output: Float32Array | Array<number>, offset = 0): void {
    const m = a.asArray();
    const otherM = b.asArray();
    const tm0 = m[0],
        tm1 = m[1],
        tm2 = m[2],
        tm3 = m[3];
    const tm4 = m[4],
        tm5 = m[5],
        tm6 = m[6],
        tm7 = m[7];
    const tm8 = m[8],
        tm9 = m[9],
        tm10 = m[10],
        tm11 = m[11];
    const tm12 = m[12],
        tm13 = m[13],
        tm14 = m[14],
        tm15 = m[15];

    const om0 = otherM[0],
        om1 = otherM[1],
        om2 = otherM[2],
        om3 = otherM[3];
    const om4 = otherM[4],
        om5 = otherM[5],
        om6 = otherM[6],
        om7 = otherM[7];
    const om8 = otherM[8],
        om9 = otherM[9],
        om10 = otherM[10],
        om11 = otherM[11];
    const om12 = otherM[12],
        om13 = otherM[13],
        om14 = otherM[14],
        om15 = otherM[15];
    output[offset] = tm0 * om0 + tm1 * om4 + tm2 * om8 + tm3 * om12;
    output[offset + 1] = tm0 * om1 + tm1 * om5 + tm2 * om9 + tm3 * om13;
    output[offset + 2] = tm0 * om2 + tm1 * om6 + tm2 * om10 + tm3 * om14;
    output[offset + 3] = tm0 * om3 + tm1 * om7 + tm2 * om11 + tm3 * om15;

    output[offset + 4] = tm4 * om0 + tm5 * om4 + tm6 * om8 + tm7 * om12;
    output[offset + 5] = tm4 * om1 + tm5 * om5 + tm6 * om9 + tm7 * om13;
    output[offset + 6] = tm4 * om2 + tm5 * om6 + tm6 * om10 + tm7 * om14;
    output[offset + 7] = tm4 * om3 + tm5 * om7 + tm6 * om11 + tm7 * om15;

    output[offset + 8] = tm8 * om0 + tm9 * om4 + tm10 * om8 + tm11 * om12;
    output[offset + 9] = tm8 * om1 + tm9 * om5 + tm10 * om9 + tm11 * om13;
    output[offset + 10] = tm8 * om2 + tm9 * om6 + tm10 * om10 + tm11 * om14;
    output[offset + 11] = tm8 * om3 + tm9 * om7 + tm10 * om11 + tm11 * om15;

    output[offset + 12] = tm12 * om0 + tm13 * om4 + tm14 * om8 + tm15 * om12;
    output[offset + 13] = tm12 * om1 + tm13 * om5 + tm14 * om9 + tm15 * om13;
    output[offset + 14] = tm12 * om2 + tm13 * om6 + tm14 * om10 + tm15 * om14;
    output[offset + 15] = tm12 * om3 + tm13 * om7 + tm14 * om11 + tm15 * om15;
}

/**
 * Multiplies two matrices and stores the result in a third matrix.
 * @param a defines the first matrix
 * @param b defines the second matrix
 * @param result defines the target matrix
 * @param offset defines the offset in the target matrix where to store the result (0 by default)
 */
export function MultiplyMatricesToRef(a: DeepImmutable<IMatrixLike>, b: DeepImmutable<IMatrixLike>, result: IMatrixLike, offset = 0): void {
    MultiplyMatricesToArray(a, b, result.asArray(), offset);
    MarkAsDirty(result);
}

/**
 * Populates the given matrix with the current matrix values
 * @param matrix defines the source matrix
 * @param target defines the target matrix
 */
export function CopyMatrixToRef(matrix: DeepImmutable<IMatrixLike>, target: IMatrixLike) {
    CopyMatrixToArray(matrix, target.asArray());
    MarkAsDirty(target);
}

/**
 * Populates the given array from the starting index with the current matrix values
 * @param matrix defines the source matrix
 * @param array defines the target array
 * @param offset defines the offset in the target array where to start storing values
 */
export function CopyMatrixToArray(matrix: DeepImmutable<IMatrixLike>, array: Float32Array | Array<number>, offset: number = 0) {
    const source = matrix.asArray();
    array[offset] = source[0];
    array[offset + 1] = source[1];
    array[offset + 2] = source[2];
    array[offset + 3] = source[3];
    array[offset + 4] = source[4];
    array[offset + 5] = source[5];
    array[offset + 6] = source[6];
    array[offset + 7] = source[7];
    array[offset + 8] = source[8];
    array[offset + 9] = source[9];
    array[offset + 10] = source[10];
    array[offset + 11] = source[11];
    array[offset + 12] = source[12];
    array[offset + 13] = source[13];
    array[offset + 14] = source[14];
    array[offset + 15] = source[15];
}

/**
 * Inverts the given matrix and stores the result in the target matrix
 * @param source defines the source matrix
 * @param target defines the target matrix
 * @returns true if the matrix was inverted successfully, false otherwise
 */
export function InvertMatrixToRef(source: DeepImmutable<IMatrixLike>, target: IMatrixLike) {
    const result = InvertMatrixToArray(source, target.asArray());

    if (result) {
        MarkAsDirty(target);
    }

    return result;
}

/**
 * Inverts the given matrix and stores the result in the target array
 * @param source defines the source matrix
 * @param target defines the target array
 * @returns true if the matrix was inverted successfully, false otherwise
 */
export function InvertMatrixToArray(source: DeepImmutable<IMatrixLike>, target: Float32Array | Array<number>) {
    // the inverse of a matrix is the transpose of cofactor matrix divided by the determinant
    const m = source.asArray();
    const m00 = m[0],
        m01 = m[1],
        m02 = m[2],
        m03 = m[3];
    const m10 = m[4],
        m11 = m[5],
        m12 = m[6],
        m13 = m[7];
    const m20 = m[8],
        m21 = m[9],
        m22 = m[10],
        m23 = m[11];
    const m30 = m[12],
        m31 = m[13],
        m32 = m[14],
        m33 = m[15];

    const det_22_33 = m22 * m33 - m32 * m23;
    const det_21_33 = m21 * m33 - m31 * m23;
    const det_21_32 = m21 * m32 - m31 * m22;
    const det_20_33 = m20 * m33 - m30 * m23;
    const det_20_32 = m20 * m32 - m22 * m30;
    const det_20_31 = m20 * m31 - m30 * m21;

    const cofact_00 = +(m11 * det_22_33 - m12 * det_21_33 + m13 * det_21_32);
    const cofact_01 = -(m10 * det_22_33 - m12 * det_20_33 + m13 * det_20_32);
    const cofact_02 = +(m10 * det_21_33 - m11 * det_20_33 + m13 * det_20_31);
    const cofact_03 = -(m10 * det_21_32 - m11 * det_20_32 + m12 * det_20_31);

    const det = m00 * cofact_00 + m01 * cofact_01 + m02 * cofact_02 + m03 * cofact_03;

    if (det === 0) {
        // Not invertible
        return false;
    }

    const detInv = 1 / det;
    const det_12_33 = m12 * m33 - m32 * m13;
    const det_11_33 = m11 * m33 - m31 * m13;
    const det_11_32 = m11 * m32 - m31 * m12;
    const det_10_33 = m10 * m33 - m30 * m13;
    const det_10_32 = m10 * m32 - m30 * m12;
    const det_10_31 = m10 * m31 - m30 * m11;
    const det_12_23 = m12 * m23 - m22 * m13;
    const det_11_23 = m11 * m23 - m21 * m13;
    const det_11_22 = m11 * m22 - m21 * m12;
    const det_10_23 = m10 * m23 - m20 * m13;
    const det_10_22 = m10 * m22 - m20 * m12;
    const det_10_21 = m10 * m21 - m20 * m11;

    const cofact_10 = -(m01 * det_22_33 - m02 * det_21_33 + m03 * det_21_32);
    const cofact_11 = +(m00 * det_22_33 - m02 * det_20_33 + m03 * det_20_32);
    const cofact_12 = -(m00 * det_21_33 - m01 * det_20_33 + m03 * det_20_31);
    const cofact_13 = +(m00 * det_21_32 - m01 * det_20_32 + m02 * det_20_31);

    const cofact_20 = +(m01 * det_12_33 - m02 * det_11_33 + m03 * det_11_32);
    const cofact_21 = -(m00 * det_12_33 - m02 * det_10_33 + m03 * det_10_32);
    const cofact_22 = +(m00 * det_11_33 - m01 * det_10_33 + m03 * det_10_31);
    const cofact_23 = -(m00 * det_11_32 - m01 * det_10_32 + m02 * det_10_31);

    const cofact_30 = -(m01 * det_12_23 - m02 * det_11_23 + m03 * det_11_22);
    const cofact_31 = +(m00 * det_12_23 - m02 * det_10_23 + m03 * det_10_22);
    const cofact_32 = -(m00 * det_11_23 - m01 * det_10_23 + m03 * det_10_21);
    const cofact_33 = +(m00 * det_11_22 - m01 * det_10_22 + m02 * det_10_21);

    target[0] = cofact_00 * detInv;
    target[1] = cofact_10 * detInv;
    target[2] = cofact_20 * detInv;
    target[3] = cofact_30 * detInv;
    target[4] = cofact_01 * detInv;
    target[5] = cofact_11 * detInv;
    target[6] = cofact_21 * detInv;
    target[7] = cofact_31 * detInv;
    target[8] = cofact_02 * detInv;
    target[9] = cofact_12 * detInv;
    target[10] = cofact_22 * detInv;
    target[11] = cofact_32 * detInv;
    target[12] = cofact_03 * detInv;
    target[13] = cofact_13 * detInv;
    target[14] = cofact_23 * detInv;
    target[15] = cofact_33 * detInv;

    return true;
}
