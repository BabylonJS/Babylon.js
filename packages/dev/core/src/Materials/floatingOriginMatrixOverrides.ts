import { Effect } from "../Materials/effect";
import { TmpVectors } from "../Maths/math.vector";
import type { Matrix } from "../Maths/math.vector";
import type { IMatrixLike, IVector3Like } from "../Maths/math.like";
import { InvertMatrixToRef, MultiplyMatricesToRef } from "../Maths/ThinMaths/thinMath.matrix.functions";
import type { Scene } from "../scene";
import type { DeepImmutable } from "../types";
import { UniformBuffer } from "./uniformBuffer";

const TempFinalMat: Matrix = TmpVectors.Matrix[4];
const TempMat1: Matrix = TmpVectors.Matrix[5];
const TempMat2: Matrix = TmpVectors.Matrix[6];

function OffsetWorldToRef(offset: IVector3Like, world: DeepImmutable<IMatrixLike>, ref: Matrix): DeepImmutable<IMatrixLike> {
    const refArray = ref.asArray();
    const worldArray = world.asArray();
    for (let i = 0; i < 16; i++) {
        refArray[i] = worldArray[i];
    }
    refArray[12] -= offset.x;
    refArray[13] -= offset.y;
    refArray[14] -= offset.z;
    return ref;
}

function OffsetViewToRef(view: DeepImmutable<IMatrixLike>, ref: Matrix): DeepImmutable<IMatrixLike> {
    const refArray = ref.asArray();
    const viewArray = view.asArray();
    for (let i = 0; i < 16; i++) {
        refArray[i] = viewArray[i];
    }
    refArray[12] = 0;
    refArray[13] = 0;
    refArray[14] = 0;
    return ref;
}

function OffsetViewProjectionToRef(view: DeepImmutable<IMatrixLike>, projection: DeepImmutable<IMatrixLike>, ref: Matrix): DeepImmutable<IMatrixLike> {
    MultiplyMatricesToRef(OffsetViewToRef(view, ref), projection, ref);
    return ref;
}

function OffsetWorldViewToRef(offset: IVector3Like, worldView: DeepImmutable<IMatrixLike>, view: DeepImmutable<IMatrixLike>, ref: Matrix): DeepImmutable<IMatrixLike> {
    // ( world * view ) * inverse ( view ) = world
    InvertMatrixToRef(view, TempMat1); // TempMat1 = inverseView
    MultiplyMatricesToRef(worldView, TempMat1, TempMat2); // TempMat2 = world, TempMat1 can be reused

    // ( offsetWorld * offsetView ) = offsetWorldView
    OffsetWorldToRef(offset, TempMat2, TempMat1); // TempMat1 = offsetWorld
    OffsetViewToRef(view, TempMat2); // TempMat2 = offsetView
    MultiplyMatricesToRef(TempMat1, TempMat2, ref);

    return ref;
}

function OffsetWorldViewProjectionToRef(
    offset: IVector3Like,
    worldViewProjection: DeepImmutable<IMatrixLike>,
    viewProjection: DeepImmutable<IMatrixLike>,
    view: DeepImmutable<IMatrixLike>,
    projection: DeepImmutable<IMatrixLike>,
    ref: IMatrixLike
): DeepImmutable<IMatrixLike> {
    // ( world * view * projection ) * inverse(projection) * inverse(view) = world
    // ( world * view * projection ) * inverse (view * projection) = world
    InvertMatrixToRef(viewProjection, TempMat1); // TempMat1 = inverse (view * projection)
    MultiplyMatricesToRef(worldViewProjection, TempMat1, TempMat2); // TempMat2 = world, TempMat1 can be reused

    // ( offsetWorld * offsetViewProjection)  = offsetWorldViewProjection
    OffsetWorldToRef(offset, TempMat2, TempMat1); // TempMat1 = offsetWorld
    OffsetViewProjectionToRef(view, projection, TempMat2); // TempMat2 = offsetViewProjection
    MultiplyMatricesToRef(TempMat1, TempMat2, ref);

    return ref;
}

function GetOffsetMatrix(uniformName: string, mat: IMatrixLike, scene: Scene): IMatrixLike {
    TempFinalMat.updateFlag = mat.updateFlag;
    switch (uniformName) {
        case "world":
            return OffsetWorldToRef(scene.floatingOriginOffset, mat, TempFinalMat);
        case "view":
            return OffsetViewToRef(mat, TempFinalMat);
        case "worldView":
            return OffsetWorldViewToRef(scene.floatingOriginOffset, mat, scene.getViewMatrix(), TempFinalMat);
        case "viewProjection":
            return OffsetViewProjectionToRef(scene.getViewMatrix(), scene.getProjectionMatrix(), TempFinalMat);
        case "worldViewProjection":
            return OffsetWorldViewProjectionToRef(scene.floatingOriginOffset, mat, scene.getTransformMatrix(), scene.getViewMatrix(), scene.getProjectionMatrix(), TempFinalMat);
        default:
            return mat;
    }
}

// ---- Overriding the prototypes of effect and uniformBuffer's setMatrix functions ----
const UniformBufferInternal = UniformBuffer as any;
const OriginalUpdateMatrixForUniform = UniformBufferInternal.prototype._updateMatrixForUniform;
const OriginalSetMatrix = Effect.prototype.setMatrix;

export function ResetMatrixFunctions() {
    Effect.prototype.setMatrix = OriginalSetMatrix;
    UniformBufferInternal.prototype._updateMatrixForUniform = OriginalUpdateMatrixForUniform;
    UniformBufferInternal.prototype._updateMatrixForUniformOverride = undefined;
}
export function OverrideMatrixFunctions(scene: Scene) {
    Effect.prototype.setMatrix = function (uniformName: string, matrix: IMatrixLike) {
        this._pipelineContext!.setMatrix(uniformName, GetOffsetMatrix(uniformName, matrix, scene));
        return this;
    };
    UniformBufferInternal.prototype._updateMatrixForUniformOverride = UniformBufferInternal.prototype._updateMatrixForUniform;
    UniformBufferInternal.prototype._updateMatrixForUniform = function (uniformName: string, matrix: IMatrixLike) {
        this._updateMatrixForUniformOverride(uniformName, GetOffsetMatrix(uniformName, matrix, scene));
    };
}
