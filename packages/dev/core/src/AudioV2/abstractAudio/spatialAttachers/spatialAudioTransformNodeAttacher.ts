import type { Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import { _AbstractSpatialAudioAttacher } from "./abstractSpatialAudioAttacher";

/** @internal */
export class _SpatialAudioTransformNodeAttacher extends _AbstractSpatialAudioAttacher {
    protected override _node: Nullable<TransformNode> = null;

    /** @internal */
    public constructor(attacherComponent: _SpatialAudioAttacherComponent) {
        super(attacherComponent);
        this.node = attacherComponent.attachedTransformNode;
    }

    protected get _attachedPosition(): Vector3 {
        if (this._node) {
            this._position.copyFrom(this._node.absolutePosition);
        } else {
            this._position.copyFromFloats(0, 0, 0);
        }
        return this._position;
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialAudioTransformNodeAttacher";
    }
}
