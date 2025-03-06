import type { Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import { _AbstractSpatialAudioAttacher, _SpatialAudioAttachedEntity } from "./abstractSpatialAudioAttacher";

/** @internal */
export class _SpatialAudioTransformNodeAttacher extends _AbstractSpatialAudioAttacher {
    protected override _node: Nullable<TransformNode>;

    protected get _attachedPosition(): Vector3 {
        if (this._node) {
            this._position.copyFrom(this._node.absolutePosition);
        } else {
            this._position.copyFromFloats(0, 0, 0);
        }
        return this._position;
    }

    /** @internal */
    public getAttacherType(): string {
        return _SpatialAudioAttachedEntity.TRANSFORM_NODE;
    }
}
