import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { ISpatialAudioNode } from "./abstractSpatialAudioAttacher";
import { _AbstractSpatialAudioAttacher } from "./abstractSpatialAudioAttacher";
import type { SpatialAudioAttachmentType } from "./spatialAudioAttacher";

const TempQuaternion = Quaternion.Identity();

/** @internal */
export async function _CreateSpatialAudioTransformNodeAttacherAsync(
    transformNode: TransformNode,
    spatialAudioNode: ISpatialAudioNode,
    attachmentType: SpatialAudioAttachmentType,
    minUpdateTime: number
): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioTransformNodeAttacher(transformNode, spatialAudioNode, attachmentType, minUpdateTime);
}

/** @internal */
export class _SpatialAudioTransformNodeAttacher extends _AbstractSpatialAudioAttacher {
    protected _transformNode: Nullable<TransformNode> = null;

    /** @internal */
    public constructor(transformNode: TransformNode, spatialAudioNode: ISpatialAudioNode, attachmentType: SpatialAudioAttachmentType, minUpdateTime: number) {
        super(spatialAudioNode, attachmentType, minUpdateTime);

        this.transformNode = transformNode;
    }

    /** @internal */
    public set transformNode(transformNode: Nullable<TransformNode>) {
        if (this._transformNode === this.transformNode) {
            return;
        }

        this._clearTransformNode();

        this._transformNode = transformNode;

        this._setScene(this._transformNode?.getScene() ?? null);

        this._isDirty = true;
        this._update();
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
    public override dispose(): void {
        super.dispose();
        this._clearTransformNode();
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialAudioTransformNodeAttacher";
    }

    protected override _update() {
        super._update();

        this._isDirty = false;
    }

    protected override _updateObservers() {
        super._updateObservers();

        if (!this._transformNode) {
            return;
        }

        this._transformNode.onAfterWorldMatrixUpdateObservable.add(this._onWorldMatrixChanged);
    }

    private _clearTransformNode() {
        this._transformNode?.onAfterWorldMatrixUpdateObservable.removeCallback(this._onWorldMatrixChanged);
        this._transformNode = null;
    }

    private _onWorldMatrixChanged = () => {
        this._isDirty = true;
        this._update();
    };
}
