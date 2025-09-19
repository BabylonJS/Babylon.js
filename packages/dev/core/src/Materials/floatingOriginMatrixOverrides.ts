import { Effect } from "../Materials/effect";
import type { IMatrixLike, IVector3Like } from "../Maths";
import { InvertMatrixToArray, MultiplyMatricesToArray } from "../Maths";
import type { Scene } from "../scene";
import type { DeepImmutable, Tuple } from "../types";
import { UniformBuffer } from "./uniformBuffer";

const TempMatArray = new Array(16).fill(0) as Tuple<number, 16>;
const TempAsArray = () => TempMatArray;
const TempMat: IMatrixLike = {
    asArray: TempAsArray,
    updateFlag: 0,
};

function ApplyWorldOffset(offset: IVector3Like, world: DeepImmutable<IMatrixLike>): DeepImmutable<IMatrixLike> {
    for (let i = 0; i < 16; i++) {
        TempMatArray[i] = world.asArray()[i];
    }
    TempMatArray[12] -= offset.x;
    TempMatArray[13] -= offset.y;
    TempMatArray[14] -= offset.z;
    return TempMat;
}

function ApplyViewOffset(view: DeepImmutable<IMatrixLike>): DeepImmutable<IMatrixLike> {
    for (let i = 0; i < 16; i++) {
        TempMatArray[i] = view.asArray()[i];
    }
    TempMatArray[12] = 0;
    TempMatArray[13] = 0;
    TempMatArray[14] = 0;
    return TempMat;
}

function ApplyViewProjectionOffset(view: DeepImmutable<IMatrixLike>, projection: DeepImmutable<IMatrixLike>): DeepImmutable<IMatrixLike> {
    MultiplyMatricesToArray(ApplyViewOffset(view), projection, TempMatArray);
    return TempMat;
}

function ApplyWorldViewOffset(offset: IVector3Like, worldView: DeepImmutable<IMatrixLike>, view: DeepImmutable<IMatrixLike>): DeepImmutable<IMatrixLike> {
    // ( world * view ) * inverse ( view ) = world
    InvertMatrixToArray(view, TempMatArray); // TempMat.toArray (TempMatArray) now contains inverseView
    MultiplyMatricesToArray(worldView, TempMat, TempMatArray); // TempMat.toArray (TempMatArray) now contains world

    // ( offsetWorld * offsetView ) = offsetWorldView
    MultiplyMatricesToArray(ApplyWorldOffset(offset, TempMat), ApplyViewOffset(view), TempMatArray);

    return TempMat;
}

function ApplyWorldViewProjectionOffset(
    offset: IVector3Like,
    worldViewProjection: DeepImmutable<IMatrixLike>,
    viewProjection: DeepImmutable<IMatrixLike>,
    view: DeepImmutable<IMatrixLike>,
    projection: DeepImmutable<IMatrixLike>
): DeepImmutable<IMatrixLike> {
    // ( world * view * projection ) * inverse (view * projection) = world
    InvertMatrixToArray(viewProjection, TempMatArray); // TempMat.toArray (TempMatArray) now contains inverse (view * projection)
    MultiplyMatricesToArray(worldViewProjection, TempMat, TempMatArray); // TempMat.toArray (TempMatArray) now contains world

    // ( offsetWorld * offsetViewProjection)  = offsetWorldViewProjection
    MultiplyMatricesToArray(ApplyWorldOffset(offset, TempMat), ApplyViewProjectionOffset(view, projection), TempMatArray);

    return TempMat;
}

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

function GetOffsetMatrix(uniformName: string, mat: IMatrixLike, scene: Scene): IMatrixLike {
    TempMat.updateFlag = mat.updateFlag;
    switch (uniformName) {
        case "world":
            return ApplyWorldOffset(scene.floatingOriginOffset, mat);
        case "view":
            return ApplyViewOffset(mat);
        case "worldView":
            return ApplyWorldViewOffset(scene.floatingOriginOffset, mat, scene.getViewMatrix());
        case "viewProjection":
            return ApplyViewProjectionOffset(scene.getViewMatrix(), scene.getProjectionMatrix());
        case "worldViewProjection":
            return ApplyWorldViewProjectionOffset(scene.floatingOriginOffset, mat, scene.getTransformMatrix(), scene.getViewMatrix(), scene.getProjectionMatrix());
        default:
            return mat;
    }
}
