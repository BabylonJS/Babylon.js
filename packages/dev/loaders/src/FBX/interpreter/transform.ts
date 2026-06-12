/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { Matrix } from "core/Maths/math.vector";

export type FBXVector3 = [number, number, number];

export interface FBXTransformComponents {
    translation: FBXVector3;
    rotation: FBXVector3;
    scale: FBXVector3;
    preRotation: FBXVector3;
    postRotation: FBXVector3;
    rotationPivot: FBXVector3;
    scalingPivot: FBXVector3;
    rotationOffset: FBXVector3;
    scalingOffset: FBXVector3;
    rotationOrder: number;
    inheritType?: number;
}

export function eulerToMatrixXYZ(rx: number, ry: number, rz: number): Matrix {
    const mx = Matrix.RotationX(rx);
    const my = Matrix.RotationY(ry);
    const mz = Matrix.RotationZ(rz);
    return mx.multiply(my).multiply(mz);
}

export function eulerToMatrix(rx: number, ry: number, rz: number, order: number): Matrix {
    const mx = Matrix.RotationX(rx);
    const my = Matrix.RotationY(ry);
    const mz = Matrix.RotationZ(rz);

    switch (order) {
        case 0:
            return mx.multiply(my).multiply(mz); // XYZ
        case 1:
            return mx.multiply(mz).multiply(my); // XZY
        case 2:
            return my.multiply(mz).multiply(mx); // YZX
        case 3:
            return my.multiply(mx).multiply(mz); // YXZ
        case 4:
            return mz.multiply(mx).multiply(my); // ZXY
        case 5:
            return mz.multiply(my).multiply(mx); // ZYX
        default:
            return mx.multiply(my).multiply(mz); // fallback to XYZ
    }
}

export function computeFBXGeometricMatrix(translation: FBXVector3, rotation: FBXVector3, scale: FBXVector3): Matrix {
    const translationM = Matrix.Translation(translation[0], translation[1], translation[2]);
    return computeFBXGeometricDeltaMatrix(rotation, scale).multiply(translationM);
}

export function computeFBXGeometricDeltaMatrix(rotation: FBXVector3, scale: FBXVector3): Matrix {
    const d2r = Math.PI / 180;
    const scaleM = Matrix.Scaling(scale[0], scale[1], scale[2]);
    const rotationM = eulerToMatrixXYZ(rotation[0] * d2r, rotation[1] * d2r, rotation[2] * d2r);
    return scaleM.multiply(rotationM);
}

export function computeFBXGeometricNormalMatrix(rotation: FBXVector3, scale: FBXVector3): Matrix {
    const d2r = Math.PI / 180;
    const inverseScaleM = Matrix.Scaling(scale[0] === 0 ? 0 : 1 / scale[0], scale[1] === 0 ? 0 : 1 / scale[1], scale[2] === 0 ? 0 : 1 / scale[2]);
    const rotationM = eulerToMatrixXYZ(rotation[0] * d2r, rotation[1] * d2r, rotation[2] * d2r);
    return inverseScaleM.multiply(rotationM);
}

export function computeFBXLocalMatrix(components: FBXTransformComponents): Matrix {
    const { translation, rotation, scale, preRotation, postRotation, rotationPivot, scalingPivot, rotationOffset, scalingOffset, rotationOrder } = components;
    const d2r = Math.PI / 180;

    const hasPivots = rotationPivot[0] !== 0 || rotationPivot[1] !== 0 || rotationPivot[2] !== 0 || scalingPivot[0] !== 0 || scalingPivot[1] !== 0 || scalingPivot[2] !== 0;
    const hasOffsets = rotationOffset[0] !== 0 || rotationOffset[1] !== 0 || rotationOffset[2] !== 0 || scalingOffset[0] !== 0 || scalingOffset[1] !== 0 || scalingOffset[2] !== 0;
    const hasPostRot = postRotation[0] !== 0 || postRotation[1] !== 0 || postRotation[2] !== 0;

    if (!hasPivots && !hasOffsets && !hasPostRot) {
        const preRotM = eulerToMatrixXYZ(preRotation[0] * d2r, preRotation[1] * d2r, preRotation[2] * d2r);
        const lclRotM = eulerToMatrix(rotation[0] * d2r, rotation[1] * d2r, rotation[2] * d2r, rotationOrder);
        const translationM = Matrix.Translation(translation[0], translation[1], translation[2]);
        const rotationM = lclRotM.multiply(preRotM);
        const scaleM = Matrix.Scaling(scale[0], scale[1], scale[2]);
        return scaleM.multiply(rotationM).multiply(translationM);
    }

    const T = Matrix.Translation(translation[0], translation[1], translation[2]);
    const Roff = Matrix.Translation(rotationOffset[0], rotationOffset[1], rotationOffset[2]);
    const Rp = Matrix.Translation(rotationPivot[0], rotationPivot[1], rotationPivot[2]);
    const RpInv = Matrix.Translation(-rotationPivot[0], -rotationPivot[1], -rotationPivot[2]);
    const Soff = Matrix.Translation(scalingOffset[0], scalingOffset[1], scalingOffset[2]);
    const Sp = Matrix.Translation(scalingPivot[0], scalingPivot[1], scalingPivot[2]);
    const SpInv = Matrix.Translation(-scalingPivot[0], -scalingPivot[1], -scalingPivot[2]);

    const Rpre = eulerToMatrixXYZ(preRotation[0] * d2r, preRotation[1] * d2r, preRotation[2] * d2r);
    const R = eulerToMatrix(rotation[0] * d2r, rotation[1] * d2r, rotation[2] * d2r, rotationOrder);
    const S = Matrix.Scaling(scale[0], scale[1], scale[2]);

    let RpostInv: Matrix;
    if (hasPostRot) {
        const Rpost = eulerToMatrixXYZ(postRotation[0] * d2r, postRotation[1] * d2r, postRotation[2] * d2r);
        RpostInv = new Matrix();
        Rpost.invertToRef(RpostInv);
    } else {
        RpostInv = Matrix.Identity();
    }

    let result = SpInv;
    result = result.multiply(S);
    result = result.multiply(Sp);
    result = result.multiply(Soff);
    result = result.multiply(RpInv);
    result = result.multiply(RpostInv);
    result = result.multiply(R);
    result = result.multiply(Rpre);
    result = result.multiply(Rp);
    result = result.multiply(Roff);
    result = result.multiply(T);
    return result;
}
