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
    attachmentType: SpatialAudioAttachmentType,
    minUpdateTime: number
): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioCameraAttacher(camera, spatialAudioNode, attachmentType, minUpdateTime);
}

/** @internal */
export class _SpatialAudioCameraAttacher extends _AbstractSpatialAudioAttacher {
    protected _camera: Nullable<Camera> = null;

    /** @internal */
    public constructor(camera: Camera, spatialAudioNode: ISpatialAudioNode, attachmentType: SpatialAudioAttachmentType, minUpdateTime: number) {
        super(spatialAudioNode, attachmentType, minUpdateTime);

        this.camera = camera;
    }

    /** @internal */
    public set camera(camera: Nullable<Camera>) {
        if (this._camera === camera) {
            return;
        }

        this._clearCamera();

        this._camera = camera;

        this._setScene(this._camera?.getScene() ?? null);

        this._isDirty = true;

        this.update();
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
    public override dispose(): void {
        super.dispose();
        this._clearCamera();
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialAudioCameraAttacher";
    }

    /** @internal */
    public override update(force = false): void {
        super.update();

        if (force) {
            this._camera?.computeWorldMatrix();
        }

        this._isDirty = false;
    }

    protected override _updateObservers() {
        super._updateObservers();

        if (!this._camera) {
            return;
        }

        if (0 < this.minUpdateTime) {
            this._camera.onViewMatrixChangedObservable.add(this._onCameraViewMatrixChanged);
        } else {
            this._camera.onViewMatrixChangedObservable.removeCallback(this._onCameraViewMatrixChanged);
        }
    }

    private _clearCamera() {
        this._camera?.onViewMatrixChangedObservable.removeCallback(this._onCameraViewMatrixChanged);
        this._camera = null;
    }

    private _onCameraViewMatrixChanged = () => {
        this._isDirty = true;
        this.update();
    };
}
