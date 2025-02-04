import type { Camera } from "../../../Cameras/camera";
import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import type { ISpatialAudioNode } from "./abstractSpatialAudioAttacher";
import { _AbstractSpatialAudioAttacher } from "./abstractSpatialAudioAttacher";
import type { SpatialAudioAttachmentType } from "./spatialAudioAttacher";

const TempQuaternion = Quaternion.Identity();

/** @internal */
export async function _CreateSpatialAudioCameraAttacherAsync(
    camera: Camera,
    spatialAudioNode: ISpatialAudioNode,
    attachmentType: SpatialAudioAttachmentType
): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioCameraAttacher(camera, spatialAudioNode, attachmentType);
}

/** @internal */
export class _SpatialAudioCameraAttacher extends _AbstractSpatialAudioAttacher {
    protected _camera: Nullable<Camera> = null;

    /** @internal */
    public constructor(camera: Camera, spatialAudioNode: ISpatialAudioNode, attachmentType: SpatialAudioAttachmentType) {
        super(spatialAudioNode, attachmentType);

        this.camera = camera;
    }

    /** @internal */
    public set camera(camera: Nullable<Camera>) {
        if (this._camera === this.camera) {
            return;
        }

        this._setScene(null);
        this._camera = camera;
        this._setScene(this._camera?.getScene() ?? null);
    }

    protected get _attachedPosition(): Vector3 {
        return this._camera?.globalPosition ?? Vector3.ZeroReadOnly;
    }

    protected get _attachedRotationQuaternion(): Quaternion {
        if (!this._camera) {
            TempQuaternion.copyFromFloats(0, 0, 0, 1);
            return TempQuaternion;
        }

        this._camera.getWorldMatrix().decompose(undefined, TempQuaternion, undefined);
        return TempQuaternion;
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialAudioCameraAttacher";
    }
}
