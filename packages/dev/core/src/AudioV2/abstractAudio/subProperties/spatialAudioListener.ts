import type { Camera } from "../../../Cameras/camera";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { SpatialAudioAttachmentType } from "../components/spatialAudioAttacherComponent";
import { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import type { ISpatialAudioListenerOptions } from "./abstractSpatialAudioListener";
import { _SpatialAudioListenerDefaults, AbstractSpatialAudioListener } from "./abstractSpatialAudioListener";

/** @internal */
export abstract class _SpatialAudioListener extends AbstractSpatialAudioListener {
    protected readonly _attacherComponent: _SpatialAudioAttacherComponent;

    protected constructor() {
        super();

        this._attacherComponent = new _SpatialAudioAttacherComponent(this);
    }

    /** @internal */
    public get attachedCamera(): Nullable<Camera> {
        return this._attacherComponent.attachedCamera;
    }

    public set attachedCamera(value: Nullable<Camera>) {
        this._attacherComponent.attachedCamera = value;
    }

    /** @internal */
    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._attacherComponent.attachedMesh;
    }

    /** @internal */
    public set attachedMesh(value: Nullable<AbstractMesh>) {
        this._attacherComponent.attachedMesh = value;
    }

    /** @internal */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._attacherComponent.attachedTransformNode;
    }

    /** @internal */
    public set attachedTransformNode(value: Nullable<TransformNode>) {
        this._attacherComponent.attachedTransformNode = value;
    }

    /** @internal */
    public get attachmentType(): SpatialAudioAttachmentType {
        return this._attacherComponent.attachmentType;
    }

    public set attachmentType(value: SpatialAudioAttachmentType) {
        this._attacherComponent.attachmentType = value;
    }

    /** @internal */
    public get isAttached(): boolean {
        return this._attacherComponent.isAttached;
    }

    /** @internal */
    public get isAttachedToPosition(): boolean {
        return this._attacherComponent.isAttachedToPosition;
    }

    /** @internal */
    public get isAttachedToRotation(): boolean {
        return this._attacherComponent.isAttachedToRotation;
    }

    /**
     * Detaches the audio source from the currently attached camera, mesh or transform node.
     */
    public detach(): void {
        this._attacherComponent.detach();
    }

    /** @internal */
    public dispose(): void {
        this._attacherComponent.dispose();
    }

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioListenerOptions>): void {
        if (options.listenerAttachedCamera !== undefined) {
            this.attachedCamera = options.listenerAttachedCamera;
        } else if (options.listenerAttachedMesh !== undefined) {
            this.attachedMesh = options.listenerAttachedMesh;
        } else if (options.listenerAttachedTransformNode !== undefined) {
            this.attachedTransformNode = options.listenerAttachedTransformNode;
        }

        if (options.listenerAttachmentType !== undefined) {
            this.attachmentType = options.listenerAttachmentType;
        }

        if (options.listenerMinUpdateTime !== undefined) {
            this.minUpdateTime = options.listenerMinUpdateTime;
        }

        if (!this._attacherComponent.isAttachedToRotation && options.listenerPosition !== undefined) {
            this.position = options.listenerPosition.clone();
        }

        if (!this._attacherComponent.isAttachedToRotation && options.listenerRotationQuaternion !== undefined) {
            if (options.listenerRotationQuaternion !== undefined) {
                this.rotationQuaternion = options.listenerRotationQuaternion.clone();
            } else if (options.listenerRotation !== undefined) {
                this.rotation = options.listenerRotation.clone();
            } else {
                this.rotationQuaternion = _SpatialAudioListenerDefaults.rotationQuaternion.clone();
            }
        }
    }
}
