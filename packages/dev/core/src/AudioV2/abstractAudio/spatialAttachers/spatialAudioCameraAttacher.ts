import type { Camera } from "../../../Cameras/camera";
import type { Vector3 } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import { _AbstractSpatialAudioAttacher, _SpatialAudioAttachedEntity } from "./abstractSpatialAudioAttacher";

/** @internal */
export class _SpatialAudioCameraAttacher extends _AbstractSpatialAudioAttacher {
    protected override _node: Nullable<Camera>;

    protected get _attachedPosition(): Vector3 {
        if (this._node) {
            this._position.copyFrom(this._node.globalPosition);
        } else {
            this._position.copyFromFloats(0, 0, 0);
        }
        return this._position;
    }

    /** @internal */
    public getAttacherType(): string {
        return _SpatialAudioAttachedEntity.CAMERA;
    }
}
