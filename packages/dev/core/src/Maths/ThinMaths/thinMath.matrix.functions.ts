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

/**
 * Multiplies two 4x4 matrices using the Strassen algorithm and stores the result in the target array.
 * @param a defines the first matrix
 * @param b defines the second matrix
 * @param output defines the target array
 * @param offset defines the offset in the target array where to store the result (0 by default)
 * @see https://en.wikipedia.org/wiki/Strassen_algorithm for more details on the algorithm
 * Playground comparing previous and new implementations: https://playground.babylonjs.com/#RO25DY#3
 */
export function MultiplyMatricesToArray(a: DeepImmutable<IMatrixLike>, b: DeepImmutable<IMatrixLike>, output: Float32Array | Array<number>, offset = 0): void {
    const A = a.asArray();
    const B = b.asArray();

    // Extract 2x2 blocks from A and B
    const A11_0 = A[0],
        A11_1 = A[1],
        A11_2 = A[4],
        A11_3 = A[5];
    const A12_0 = A[2],
        A12_1 = A[3],
        A12_2 = A[6],
        A12_3 = A[7];
    const A21_0 = A[8],
        A21_1 = A[9],
        A21_2 = A[12],
        A21_3 = A[13];
    const A22_0 = A[10],
        A22_1 = A[11],
        A22_2 = A[14],
        A22_3 = A[15];

    const B11_0 = B[0],
        B11_1 = B[1],
        B11_2 = B[4],
        B11_3 = B[5];
    const B12_0 = B[2],
        B12_1 = B[3],
        B12_2 = B[6],
        B12_3 = B[7];
    const B21_0 = B[8],
        B21_1 = B[9],
        B21_2 = B[12],
        B21_3 = B[13];
    const B22_0 = B[10],
        B22_1 = B[11],
        B22_2 = B[14],
        B22_3 = B[15];

    // Strassen's 7 products (fully inlined)
    // M1 = (A11 + A22) * (B11 + B22)
    const S1_0 = A11_0 + A22_0,
        S1_1 = A11_1 + A22_1,
        S1_2 = A11_2 + A22_2,
        S1_3 = A11_3 + A22_3;
    const S2_0 = B11_0 + B22_0,
        S2_1 = B11_1 + B22_1,
        S2_2 = B11_2 + B22_2,
        S2_3 = B11_3 + B22_3;
    const M1_0 = S1_0 * S2_0 + S1_1 * S2_2,
        M1_1 = S1_0 * S2_1 + S1_1 * S2_3;
    const M1_2 = S1_2 * S2_0 + S1_3 * S2_2,
        M1_3 = S1_2 * S2_1 + S1_3 * S2_3;

    // M2 = (A21 + A22) * B11
    const S3_0 = A21_0 + A22_0,
        S3_1 = A21_1 + A22_1,
        S3_2 = A21_2 + A22_2,
        S3_3 = A21_3 + A22_3;
    const M2_0 = S3_0 * B11_0 + S3_1 * B11_2,
        M2_1 = S3_0 * B11_1 + S3_1 * B11_3;
    const M2_2 = S3_2 * B11_0 + S3_3 * B11_2,
        M2_3 = S3_2 * B11_1 + S3_3 * B11_3;

    // M3 = A11 * (B12 - B22)
    const S4_0 = B12_0 - B22_0,
        S4_1 = B12_1 - B22_1,
        S4_2 = B12_2 - B22_2,
        S4_3 = B12_3 - B22_3;
    const M3_0 = A11_0 * S4_0 + A11_1 * S4_2,
        M3_1 = A11_0 * S4_1 + A11_1 * S4_3;
    const M3_2 = A11_2 * S4_0 + A11_3 * S4_2,
        M3_3 = A11_2 * S4_1 + A11_3 * S4_3;

    // M4 = A22 * (B21 - B11)
    const S5_0 = B21_0 - B11_0,
        S5_1 = B21_1 - B11_1,
        S5_2 = B21_2 - B11_2,
        S5_3 = B21_3 - B11_3;
    const M4_0 = A22_0 * S5_0 + A22_1 * S5_2,
        M4_1 = A22_0 * S5_1 + A22_1 * S5_3;
    const M4_2 = A22_2 * S5_0 + A22_3 * S5_2,
        M4_3 = A22_2 * S5_1 + A22_3 * S5_3;

    // M5 = (A11 + A12) * B22
    const S6_0 = A11_0 + A12_0,
        S6_1 = A11_1 + A12_1,
        S6_2 = A11_2 + A12_2,
        S6_3 = A11_3 + A12_3;
    const M5_0 = S6_0 * B22_0 + S6_1 * B22_2,
        M5_1 = S6_0 * B22_1 + S6_1 * B22_3;
    const M5_2 = S6_2 * B22_0 + S6_3 * B22_2,
        M5_3 = S6_2 * B22_1 + S6_3 * B22_3;

    // M6 = (A21 - A11) * (B11 + B12)
    const S7_0 = A21_0 - A11_0,
        S7_1 = A21_1 - A11_1,
        S7_2 = A21_2 - A11_2,
        S7_3 = A21_3 - A11_3;
    const S8_0 = B11_0 + B12_0,
        S8_1 = B11_1 + B12_1,
        S8_2 = B11_2 + B12_2,
        S8_3 = B11_3 + B12_3;
    const M6_0 = S7_0 * S8_0 + S7_1 * S8_2,
        M6_1 = S7_0 * S8_1 + S7_1 * S8_3;
    const M6_2 = S7_2 * S8_0 + S7_3 * S8_2,
        M6_3 = S7_2 * S8_1 + S7_3 * S8_3;

    // M7 = (A12 - A22) * (B21 + B22)
    const S9_0 = A12_0 - A22_0,
        S9_1 = A12_1 - A22_1,
        S9_2 = A12_2 - A22_2,
        S9_3 = A12_3 - A22_3;
    const S10_0 = B21_0 + B22_0,
        S10_1 = B21_1 + B22_1,
        S10_2 = B21_2 + B22_2,
        S10_3 = B21_3 + B22_3;
    const M7_0 = S9_0 * S10_0 + S9_1 * S10_2,
        M7_1 = S9_0 * S10_1 + S9_1 * S10_3;
    const M7_2 = S9_2 * S10_0 + S9_3 * S10_2,
        M7_3 = S9_2 * S10_1 + S9_3 * S10_3;

    // Compute result blocks (fully inlined)
    // C11 = M1 + M4 - M5 + M7
    const C11_0 = M1_0 + M4_0 - M5_0 + M7_0;
    const C11_1 = M1_1 + M4_1 - M5_1 + M7_1;
    const C11_2 = M1_2 + M4_2 - M5_2 + M7_2;
    const C11_3 = M1_3 + M4_3 - M5_3 + M7_3;

    // C12 = M3 + M5
    const C12_0 = M3_0 + M5_0;
    const C12_1 = M3_1 + M5_1;
    const C12_2 = M3_2 + M5_2;
    const C12_3 = M3_3 + M5_3;

    // C21 = M2 + M4
    const C21_0 = M2_0 + M4_0;
    const C21_1 = M2_1 + M4_1;
    const C21_2 = M2_2 + M4_2;
    const C21_3 = M2_3 + M4_3;

    // C22 = M1 + M3 - M2 + M6
    const C22_0 = M1_0 + M3_0 - M2_0 + M6_0;
    const C22_1 = M1_1 + M3_1 - M2_1 + M6_1;
    const C22_2 = M1_2 + M3_2 - M2_2 + M6_2;
    const C22_3 = M1_3 + M3_3 - M2_3 + M6_3;

    // Write result to output
    output[offset + 0] = C11_0;
    output[offset + 1] = C11_1;
    output[offset + 2] = C12_0;
    output[offset + 3] = C12_1;

    output[offset + 4] = C11_2;
    output[offset + 5] = C11_3;
    output[offset + 6] = C12_2;
    output[offset + 7] = C12_3;

    output[offset + 8] = C21_0;
    output[offset + 9] = C21_1;
    output[offset + 10] = C22_0;
    output[offset + 11] = C22_1;

    output[offset + 12] = C21_2;
    output[offset + 13] = C21_3;
    output[offset + 14] = C22_2;
    output[offset + 15] = C22_3;
}
