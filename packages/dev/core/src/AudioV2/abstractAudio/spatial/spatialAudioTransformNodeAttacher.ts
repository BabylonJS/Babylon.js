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

        this.transformNode = transformNode;
        this.spatialAudioNode = spatialAudioNode;
    }

    /** @internal */
    public set transformNode(transformNode: Nullable<TransformNode>) {
        if (this._transformNode === this.transformNode) {
            return;
        }

        this._detachTransformNode();
        this._transformNode = transformNode;
        this._attachTransformNode();
    }

    protected get _attachedPosition(): Vector3 {
        return this._transformNode?.position ?? Vector3.ZeroReadOnly;
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

    private _attachTransformNode(): void {
        this._setScene(this._transformNode?.getScene() ?? null);
    }

    private _detachTransformNode(): void {
        this._setScene(null);
    }
}
