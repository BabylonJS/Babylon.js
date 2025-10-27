import { Effect } from "../Materials/effect";
import { Matrix } from "../Maths/math.vector";
import type { IMatrixLike, IVector3Like } from "../Maths/math.like";
import { InvertMatrixToRef, MultiplyMatricesToRef } from "../Maths/ThinMaths/thinMath.matrix.functions";
import type { Scene } from "../scene";
import type { DeepImmutable } from "../types";
import { UniformBuffer } from "./uniformBuffer";

const TempFinalMat: Matrix = new Matrix();
const TempMat1: Matrix = new Matrix();
const TempMat2: Matrix = new Matrix();

/**
 * When rendering, each scene will reset this to ensure the correct floating origin offset is when overriding the below functions
 */
export const FloatingOriginCurrentScene = {
    getScene: () => undefined as Scene | undefined,
    target: undefined as string | undefined,
};

function OffsetWorldToRef(offset: IVector3Like, world: DeepImmutable<IMatrixLike>, ref: Matrix): DeepImmutable<IMatrixLike> {
    const refArray = ref.asArray();
    const worldArray = world.asArray();
    for (let i = 0; i < 16; i++) {
        refArray[i] = worldArray[i];
    }
    refArray[12] -= offset.x;
    refArray[13] -= offset.y;
    refArray[14] -= offset.z;
    Matrix.FromArrayToRef(refArray, 0, ref);
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
    Matrix.FromArrayToRef(refArray, 0, ref);
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

export function OffsetLightTransformMatrix(
    offset: IVector3Like,
    viewMatrix: DeepImmutable<IMatrixLike>,
    projectionMatrix: DeepImmutable<IMatrixLike>,
    ref: IMatrixLike
): DeepImmutable<IMatrixLike> {
    InvertMatrixToRef(viewMatrix, TempMat1); // TempMat1 = light world matrix (inverse of view)
    OffsetWorldToRef(offset, TempMat1, TempMat2); // TempMat2 = offset light world matrix
    InvertMatrixToRef(TempMat2, TempMat1); // TempMat1 = offset view matrix
    MultiplyMatricesToRef(TempMat1, projectionMatrix, ref);
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

function GetOffsetMatrix(uniformName: string, mat: IMatrixLike): IMatrixLike {
    TempFinalMat.updateFlag = mat.updateFlag;
    const scene = FloatingOriginCurrentScene.getScene();
    // Early out for scenes that don't have floatingOriginMode enabled, or if call originates from a renderTarget (and not the main scene)
    if (!scene || FloatingOriginCurrentScene.target) {
        return mat;
    }
    const offset = scene.floatingOriginOffset;
    switch (uniformName) {
        case "world":
            return OffsetWorldToRef(offset, mat, TempFinalMat);
        case "view":
            return OffsetViewToRef(mat, TempFinalMat);
        case "worldView":
            return OffsetWorldViewToRef(offset, mat, scene.getViewMatrix(), TempFinalMat);
        case "viewProjection":
            return OffsetViewProjectionToRef(scene.getViewMatrix(), scene.getProjectionMatrix(), TempFinalMat);
        case "worldViewProjection":
            return OffsetWorldViewProjectionToRef(offset, mat, scene.getTransformMatrix(), scene.getViewMatrix(), scene.getProjectionMatrix(), TempFinalMat);
        default:
            return mat;
    }
}

// ---- Overriding the prototypes of effect and uniformBuffer's setMatrix functions ----
const UniformBufferInternal = UniformBuffer as any;
const EffectInternal = Effect as any;
const OriginalUpdateMatrixForUniform = UniformBufferInternal.prototype._updateMatrixForUniform;
const OriginalSetMatrix = Effect.prototype.setMatrix;

export function ResetMatrixFunctions() {
    Effect.prototype.setMatrix = OriginalSetMatrix;
    EffectInternal._setMatrixOverride = undefined;
    UniformBufferInternal.prototype._updateMatrixForUniform = OriginalUpdateMatrixForUniform;
    UniformBufferInternal.prototype._updateMatrixForUniformOverride = undefined;
}

export function OverrideMatrixFunctions() {
    EffectInternal.prototype._setMatrixOverride = OriginalSetMatrix;
    EffectInternal.prototype.setMatrix = function (uniformName: string, matrix: IMatrixLike) {
        this._setMatrixOverride(uniformName, GetOffsetMatrix(uniformName, matrix));
        return this;
    };
    UniformBufferInternal.prototype._updateMatrixForUniformOverride = OriginalUpdateMatrixForUniform;
    UniformBufferInternal.prototype._updateMatrixForUniform = function (uniformName: string, matrix: IMatrixLike) {
        this._updateMatrixForUniformOverride(uniformName, GetOffsetMatrix(uniformName, matrix));
    };
}
