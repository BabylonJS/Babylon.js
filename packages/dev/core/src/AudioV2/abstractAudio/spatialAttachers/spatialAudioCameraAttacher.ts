import type { Camera } from "../../../Cameras/camera";
import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import type { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import { _AbstractSpatialAudioAttacher } from "./abstractSpatialAudioAttacher";

const TempQuaternion = Quaternion.Identity();

/**
 * NB: This function is async so it can use a dynamic import in the future if needed.
 * @internal
 * */
export async function _CreateSpatialAudioCameraAttacherAsync(attacherComponent: _SpatialAudioAttacherComponent): Promise<_AbstractSpatialAudioAttacher> {
    return new _SpatialAudioCameraAttacher(attacherComponent);
}

/** @internal */
export class _SpatialAudioCameraAttacher extends _AbstractSpatialAudioAttacher {
    protected _camera: Nullable<Camera> = null;

    /** @internal */
    public constructor(attacherComponent: _SpatialAudioAttacherComponent) {
        super(attacherComponent);

        this.camera = attacherComponent.attachedCamera;
    }

    /** @internal */
    public set camera(camera: Nullable<Camera>) {
        if (this._camera === camera) {
            return;
        }

        this._clearCamera();

        this._camera = camera;
        this._camera?.onDisposeObservable.add(this._onCameraDisposed);

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

        // TODO: Use view matrix.
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
    public override update(force: boolean = false): void {
        super.update();

        if (force) {
            this._camera?.computeWorldMatrix();
        }
    }

    private _clearCamera() {
        this._camera?.onDisposeObservable.removeCallback(this._onCameraDisposed);
        this._camera = null;
    }

    private _onCameraDisposed = () => {
        this.dispose();
    };
}
