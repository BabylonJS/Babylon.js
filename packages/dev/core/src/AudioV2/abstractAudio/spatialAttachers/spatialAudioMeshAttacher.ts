import type { Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { Nullable } from "../../../types";
import { _SpatialAudioAttachedEntity } from "./abstractSpatialAudioAttacher";
import { _SpatialAudioTransformNodeAttacher } from "./spatialAudioTransformNodeAttacher";

/** @internal */
export class _SpatialAudioMeshAttacher extends _SpatialAudioTransformNodeAttacher {
    protected override _node: Nullable<AbstractMesh>;

    protected override get _attachedPosition(): Vector3 {
        if (this._node) {
            this._position.copyFrom(this._node.getBoundingInfo().boundingSphere.centerWorld);
        } else {
            this._position.copyFromFloats(0, 0, 0);
        }
        return this._position;
    }

    /** @internal */
    public override getAttacherType(): string {
        return _SpatialAudioAttachedEntity.MESH;
    }
}
