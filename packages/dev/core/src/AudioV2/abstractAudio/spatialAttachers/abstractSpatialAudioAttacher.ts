import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import { SpatialAudioAttachmentType } from "../components/spatialAudioAttacherComponent";

/** @internal */
export abstract class _AbstractSpatialAudioAttacher {
    private readonly _attacherComponent: _SpatialAudioAttacherComponent;

    protected abstract _attachedPosition: Vector3;
    protected abstract _attachedRotationQuaternion: Quaternion;

    protected constructor(attacherComponent: _SpatialAudioAttacherComponent) {
        this._attacherComponent = attacherComponent;
    }

    /** @internal */
    public dispose(): void {
        this._attacherComponent.detach();
    }

    /** @internal */
    public abstract getClassName(): string;

    /** @internal */
    public update(_force: boolean = false): void {
        if (!this._attacherComponent._spatialAudioNode) {
            return;
        }

        if (this._attacherComponent.attachmentType & SpatialAudioAttachmentType.POSITION) {
            this._attacherComponent._spatialAudioNode.position = this._attachedPosition;
        }

        if (this._attacherComponent.attachmentType & SpatialAudioAttachmentType.ROTATION) {
            this._attacherComponent._spatialAudioNode.rotationQuaternion = this._attachedRotationQuaternion;
        }
    }
}
