import { type IResolvedDiagnostic, type IResolvedTransform, type Mat4, type Quat, type Vec3 } from "../resolvedStage";
import { type ISdfPrimSpec } from "../sdf/index";
import { AsMat4, AsQuat, AsVec3, GetAttribute, GetAttributeValue, GetTokenArrayAttribute } from "./valueAccess";

const DegreesToRadians = Math.PI / 180;

/**
 * Returns the identity resolved transform.
 * @returns an identity TRS transform
 */
export function IdentityTransform(): IResolvedTransform {
    return { translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] };
}

/**
 * Resolves a USD xformOp stack into TRS plus an optional fallback matrix.
 * @param prim prim whose xformOps should be evaluated
 * @param diagnostics diagnostics sink for unsupported operations
 * @returns resolved local transform
 */
export function ResolveTransform(prim: ISdfPrimSpec, diagnostics: IResolvedDiagnostic[]): IResolvedTransform {
    const orderedOps = GetOrderedXformOps(prim);
    if (orderedOps.length === 0) {
        return ResolveFallbackTransform(prim);
    }

    const cleanTransform = TryResolveCleanTrs(prim, orderedOps);
    if (cleanTransform) {
        return cleanTransform;
    }

    let matrix = IdentityMatrix();
    for (const orderedOp of orderedOps) {
        const op = ResolveXformOpMatrix(prim, orderedOp, diagnostics);
        if (op) {
            matrix = MultiplyMatrices(matrix, op);
        }
    }

    return { ...DecomposeMatrix(matrix), matrix };
}

/**
 * Returns a copy of a USD-authored `matrix4d` value in the resolved matrix layout.
 *
 * USD `GfMatrix4d` is stored row-major with row-vector semantics (v' = v * M) and the translation
 * in the last row (flat indices 12-14). That flat layout is byte-identical to Babylon's `Matrix.m`,
 * so no transpose or reordering is required: the resolved contract carries the authored values
 * directly and the adapter feeds them straight into `Matrix.FromArray`. This is a defensive copy
 * so callers never alias the authored array.
 * @param matrix USD-authored `matrix4d` (16 numbers, row-major)
 * @returns a copy of the matrix in the resolved layout
 */
export function UsdMatrixToResolvedLayout(matrix: Mat4): Mat4 {
    return [...matrix];
}

/**
 * Decomposes an affine matrix in the resolved `Mat4` flat layout (Babylon `Matrix.m` order, with the
 * translation in flat indices 12-14) into TRS.
 * @param matrix affine matrix in the resolved `Mat4` layout
 * @returns decomposed transform
 */
export function DecomposeMatrix(matrix: Mat4): IResolvedTransform {
    const translation: Vec3 = [matrix[12] ?? 0, matrix[13] ?? 0, matrix[14] ?? 0];
    const sx = VectorLength(matrix[0], matrix[1], matrix[2]) || 1;
    const sy = VectorLength(matrix[4], matrix[5], matrix[6]) || 1;
    const sz = VectorLength(matrix[8], matrix[9], matrix[10]) || 1;
    const scale: Vec3 = [sx, sy, sz];
    const rotation = QuaternionFromRotationMatrix([
        matrix[0] / sx,
        matrix[1] / sx,
        matrix[2] / sx,
        0,
        matrix[4] / sy,
        matrix[5] / sy,
        matrix[6] / sy,
        0,
        matrix[8] / sz,
        matrix[9] / sz,
        matrix[10] / sz,
        0,
        0,
        0,
        0,
        1,
    ]);
    return { translation, rotation, scale };
}

function GetOrderedXformOps(prim: ISdfPrimSpec): string[] {
    const order = GetTokenArrayAttribute(prim, "xformOpOrder") ?? [];
    const resetIndex = order.lastIndexOf("!resetXformStack!");
    return resetIndex >= 0 ? order.slice(resetIndex + 1) : order;
}

function ResolveFallbackTransform(prim: ISdfPrimSpec): IResolvedTransform {
    const transform = IdentityTransform();
    transform.translation = AsVec3(GetAttributeValue(GetAttribute(prim, "xformOp:translate"))) ?? transform.translation;
    transform.rotation =
        AsQuat(GetAttributeValue(GetAttribute(prim, "xformOp:orient"))) ??
        (AsVec3(GetAttributeValue(GetAttribute(prim, "xformOp:rotateXYZ")))
            ? QuaternionFromEulerXyz(AsVec3(GetAttributeValue(GetAttribute(prim, "xformOp:rotateXYZ")))!)
            : transform.rotation);
    transform.scale = AsVec3(GetAttributeValue(GetAttribute(prim, "xformOp:scale"))) ?? transform.scale;
    return transform;
}

function TryResolveCleanTrs(prim: ISdfPrimSpec, orderedOps: string[]): IResolvedTransform | undefined {
    const transform = IdentityTransform();
    let phase = 0;

    for (const orderedOp of orderedOps) {
        const { inverted, opName } = NormalizeXformOpToken(orderedOp);
        if (inverted || opName.includes(":pivot") || opName === "xformOp:transform") {
            return undefined;
        }
        if (opName === "xformOp:translate") {
            if (phase > 0) {
                return undefined;
            }
            transform.translation = AddVec3(transform.translation, AsVec3(GetAttributeValue(GetAttribute(prim, opName))) ?? [0, 0, 0]);
            continue;
        }
        if (opName === "xformOp:orient" || opName === "xformOp:rotateXYZ" || opName === "xformOp:rotateX" || opName === "xformOp:rotateY" || opName === "xformOp:rotateZ") {
            if (phase > 1) {
                return undefined;
            }
            phase = 1;
            transform.rotation = MultiplyQuaternions(transform.rotation, ResolveRotationQuaternion(prim, opName));
            continue;
        }
        if (opName === "xformOp:scale") {
            phase = 2;
            const scale = AsVec3(GetAttributeValue(GetAttribute(prim, opName))) ?? [1, 1, 1];
            transform.scale = [transform.scale[0] * scale[0], transform.scale[1] * scale[1], transform.scale[2] * scale[2]];
            continue;
        }
        return undefined;
    }

    return transform;
}

function ResolveXformOpMatrix(prim: ISdfPrimSpec, orderedOp: string, diagnostics: IResolvedDiagnostic[]): Mat4 | undefined {
    const { inverted, opName } = NormalizeXformOpToken(orderedOp);
    let matrix: Mat4 | undefined;

    if (opName.startsWith("xformOp:translate")) {
        const translation = AsVec3(GetAttributeValue(GetAttribute(prim, opName))) ?? [0, 0, 0];
        matrix = TranslationMatrix(translation);
    } else if (opName === "xformOp:scale") {
        const scale = AsVec3(GetAttributeValue(GetAttribute(prim, opName))) ?? [1, 1, 1];
        matrix = ScaleMatrix(scale);
    } else if (opName === "xformOp:orient" || opName === "xformOp:rotateXYZ" || opName === "xformOp:rotateX" || opName === "xformOp:rotateY" || opName === "xformOp:rotateZ") {
        matrix = RotationMatrix(ResolveRotationQuaternion(prim, opName));
    } else if (opName === "xformOp:transform") {
        const authoredMatrix = AsMat4(GetAttributeValue(GetAttribute(prim, opName)));
        matrix = authoredMatrix ? UsdMatrixToResolvedLayout(authoredMatrix) : IdentityMatrix();
    } else {
        diagnostics.push({ severity: "warning", path: prim.path, message: `Unsupported xformOp '${orderedOp}' was ignored.` });
        return undefined;
    }

    return inverted ? InvertAffineMatrix(matrix) : matrix;
}

function ResolveRotationQuaternion(prim: ISdfPrimSpec, opName: string): Quat {
    if (opName === "xformOp:orient") {
        return AsQuat(GetAttributeValue(GetAttribute(prim, opName))) ?? [0, 0, 0, 1];
    }
    const rotate = AsVec3(GetAttributeValue(GetAttribute(prim, opName)));
    if (opName === "xformOp:rotateXYZ") {
        return QuaternionFromEulerXyz(rotate ?? [0, 0, 0]);
    }
    const degrees = AsNumberFromRotationOp(prim, opName);
    if (opName === "xformOp:rotateX") {
        return QuaternionFromAxisAngle([1, 0, 0], degrees);
    }
    if (opName === "xformOp:rotateY") {
        return QuaternionFromAxisAngle([0, 1, 0], degrees);
    }
    return QuaternionFromAxisAngle([0, 0, 1], degrees);
}

function AsNumberFromRotationOp(prim: ISdfPrimSpec, opName: string): number {
    const value = GetAttributeValue(GetAttribute(prim, opName));
    return typeof value?.value === "number" ? value.value : 0;
}

function NormalizeXformOpToken(orderedOp: string): { inverted: boolean; opName: string } {
    const prefix = "!invert!";
    return orderedOp.startsWith(prefix) ? { inverted: true, opName: orderedOp.slice(prefix.length) } : { inverted: false, opName: orderedOp };
}

function IdentityMatrix(): Mat4 {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function TranslationMatrix(translation: Vec3): Mat4 {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, translation[0], translation[1], translation[2], 1];
}

function ScaleMatrix(scale: Vec3): Mat4 {
    return [scale[0], 0, 0, 0, 0, scale[1], 0, 0, 0, 0, scale[2], 0, 0, 0, 0, 1];
}

function RotationMatrix(quaternion: Quat): Mat4 {
    const [x, y, z, w] = quaternion;
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    return [1 - (yy + zz), xy + wz, xz - wy, 0, xy - wz, 1 - (xx + zz), yz + wx, 0, xz + wy, yz - wx, 1 - (xx + yy), 0, 0, 0, 0, 1];
}

function MultiplyMatrices(left: Mat4, right: Mat4): Mat4 {
    const result = new Array<number>(16).fill(0);
    for (let column = 0; column < 4; column++) {
        for (let row = 0; row < 4; row++) {
            result[column * 4 + row] =
                left[0 * 4 + row] * right[column * 4 + 0] +
                left[1 * 4 + row] * right[column * 4 + 1] +
                left[2 * 4 + row] * right[column * 4 + 2] +
                left[3 * 4 + row] * right[column * 4 + 3];
        }
    }
    return result;
}

function InvertAffineMatrix(matrix: Mat4): Mat4 {
    const a00 = matrix[0];
    const a01 = matrix[4];
    const a02 = matrix[8];
    const a10 = matrix[1];
    const a11 = matrix[5];
    const a12 = matrix[9];
    const a20 = matrix[2];
    const a21 = matrix[6];
    const a22 = matrix[10];
    const det = a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20);
    if (Math.abs(det) < 1e-8) {
        return IdentityMatrix();
    }
    const invDet = 1 / det;
    const r00 = (a11 * a22 - a12 * a21) * invDet;
    const r01 = (a02 * a21 - a01 * a22) * invDet;
    const r02 = (a01 * a12 - a02 * a11) * invDet;
    const r10 = (a12 * a20 - a10 * a22) * invDet;
    const r11 = (a00 * a22 - a02 * a20) * invDet;
    const r12 = (a02 * a10 - a00 * a12) * invDet;
    const r20 = (a10 * a21 - a11 * a20) * invDet;
    const r21 = (a01 * a20 - a00 * a21) * invDet;
    const r22 = (a00 * a11 - a01 * a10) * invDet;
    const tx = matrix[12];
    const ty = matrix[13];
    const tz = matrix[14];
    return [r00, r10, r20, 0, r01, r11, r21, 0, r02, r12, r22, 0, -(r00 * tx + r01 * ty + r02 * tz), -(r10 * tx + r11 * ty + r12 * tz), -(r20 * tx + r21 * ty + r22 * tz), 1];
}

function QuaternionFromEulerXyz(degrees: Vec3): Quat {
    return MultiplyQuaternions(
        MultiplyQuaternions(QuaternionFromAxisAngle([1, 0, 0], degrees[0]), QuaternionFromAxisAngle([0, 1, 0], degrees[1])),
        QuaternionFromAxisAngle([0, 0, 1], degrees[2])
    );
}

function QuaternionFromAxisAngle(axis: Vec3, degrees: number): Quat {
    const halfAngle = (degrees * DegreesToRadians) / 2;
    const s = Math.sin(halfAngle);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(halfAngle)];
}

function QuaternionFromRotationMatrix(matrix: Mat4): Quat {
    const m11 = matrix[0];
    const m12 = matrix[4];
    const m13 = matrix[8];
    const m21 = matrix[1];
    const m22 = matrix[5];
    const m23 = matrix[9];
    const m31 = matrix[2];
    const m32 = matrix[6];
    const m33 = matrix[10];
    const trace = m11 + m22 + m33;
    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1);
        return [(m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s];
    }
    if (m11 > m22 && m11 > m33) {
        const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
        return [0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s];
    }
    if (m22 > m33) {
        const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
        return [(m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s];
    }
    const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
    return [(m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s];
}

function MultiplyQuaternions(left: Quat, right: Quat): Quat {
    return [
        left[3] * right[0] + left[0] * right[3] + left[1] * right[2] - left[2] * right[1],
        left[3] * right[1] - left[0] * right[2] + left[1] * right[3] + left[2] * right[0],
        left[3] * right[2] + left[0] * right[1] - left[1] * right[0] + left[2] * right[3],
        left[3] * right[3] - left[0] * right[0] - left[1] * right[1] - left[2] * right[2],
    ];
}

function AddVec3(left: Vec3, right: Vec3): Vec3 {
    return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function VectorLength(x: number, y: number, z: number): number {
    return Math.sqrt(x * x + y * y + z * z);
}
