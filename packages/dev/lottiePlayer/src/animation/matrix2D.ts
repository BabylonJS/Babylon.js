// 2D affine matrices stored as [a, b, c, d, e, f] mapping
//   (x, y) -> (a*x + c*y + e, b*x + d*y + f)
// This matches the 2x3 column convention used by canvas/Lottie.

export type Mat2D = [number, number, number, number, number, number];

/**
 * Multiplies two 2D affine matrices.
 * @param m The outer matrix, applied second.
 * @param n The inner matrix, applied first.
 * @returns The product `m * n`.
 */
export function MultiplyMat2D(m: Mat2D, n: Mat2D): Mat2D {
    const result: Mat2D = [0, 0, 0, 0, 0, 0];
    MultiplyMat2DInto(m, n, result);
    return result;
}

/**
 * Multiplies two 2D affine matrices into an existing matrix. The output may alias either input.
 * @param m The outer matrix, applied second.
 * @param n The inner matrix, applied first.
 * @param out Receives the product `m * n`.
 */
export function MultiplyMat2DInto(m: Mat2D, n: Mat2D, out: Mat2D): void {
    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m3 = m[3];
    const m4 = m[4];
    const m5 = m[5];
    const n0 = n[0];
    const n1 = n[1];
    const n2 = n[2];
    const n3 = n[3];
    const n4 = n[4];
    const n5 = n[5];
    out[0] = m0 * n0 + m2 * n1;
    out[1] = m1 * n0 + m3 * n1;
    out[2] = m0 * n2 + m2 * n3;
    out[3] = m1 * n2 + m3 * n3;
    out[4] = m0 * n4 + m2 * n5 + m4;
    out[5] = m1 * n4 + m3 * n5 + m5;
}

/**
 * Transforms a point through a matrix.
 * @param m The matrix to transform with.
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @param out Receives the transformed point.
 */
export function TransformPoint(m: Mat2D, x: number, y: number, out: [number, number]): void {
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
}

/**
 * Builds a Lottie transform matrix: T(position) * R(rotation) * S(scale) * T(-anchor).
 * @param anchor The anchor point, in layer-local space.
 * @param position The position the anchor maps to.
 * @param scale The scale in percent (100 = identity).
 * @param rotationDeg The rotation in degrees.
 * @returns The composed transform matrix.
 */
export function BuildLottieMatrix(anchor: number[], position: number[], scale: number[], rotationDeg: number): Mat2D {
    const result: Mat2D = [0, 0, 0, 0, 0, 0];
    BuildLottieMatrixInto(anchor, position, scale, rotationDeg, result);
    return result;
}

/**
 * Builds a Lottie transform matrix into an existing matrix.
 * @param anchor The anchor point, in layer-local space.
 * @param position The position the anchor maps to.
 * @param scale The scale in percent (100 = identity).
 * @param rotationDeg The rotation in degrees.
 * @param out Receives the composed transform matrix.
 */
export function BuildLottieMatrixInto(anchor: number[], position: number[], scale: number[], rotationDeg: number, out: Mat2D): void {
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const sx = scale[0] / 100;
    const sy = scale[1] / 100;
    // Rotation * Scale (upper 2x2).
    const a = cos * sx;
    const b = sin * sx;
    const c = -sin * sy;
    const d = cos * sy;
    // Translate so the anchor maps to position.
    const e = position[0] - (a * anchor[0] + c * anchor[1]);
    const f = position[1] - (b * anchor[0] + d * anchor[1]);
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = e;
    out[5] = f;
}
