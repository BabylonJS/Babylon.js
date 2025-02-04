import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { ISpatialAudioNode } from "./abstractSpatialAudioAttacher";
import { _AbstractSpatialAudioAttacher } from "./abstractSpatialAudioAttacher";

const TempQuaternion = Quaternion.Identity();

/** @internal */
export async function _CreateSpatialAudioTransformNodeAttacherAsync(transformNode: TransformNode, spatialAudioNode: ISpatialAudioNode): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioTransformNodeAttacher(transformNode, spatialAudioNode);
}

/** @internal */
export class _SpatialAudioTransformNodeAttacher extends _AbstractSpatialAudioAttacher {
    protected _transformNode: Nullable<TransformNode> = null;

    /** @internal */
    public constructor(transformNode: TransformNode, spatialAudioNode: ISpatialAudioNode) {
        super();

        this.spatialAudioNode = spatialAudioNode;
        this.transformNode = transformNode;
    }

    /** @internal */
    public set transformNode(transformNode: Nullable<TransformNode>) {
        if (this._transformNode === this.transformNode) {
            return;
        }

        this._setScene(null);
        this._transformNode = transformNode;
        this._setScene(this._transformNode?.getScene() ?? null);
    }

    protected get _attachedPosition(): Vector3 {
        return this._transformNode?.absolutePosition ?? Vector3.ZeroReadOnly;
    }

    protected get _attachedRotationQuaternion(): Quaternion {
        if (!this._transformNode) {
            TempQuaternion.copyFromFloats(0, 0, 0, 1);
            return TempQuaternion;
        }

        this._transformNode.getWorldMatrix().decompose(undefined, TempQuaternion, undefined);
        return TempQuaternion;
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialAudioTransformNodeAttacher";
    }
}
