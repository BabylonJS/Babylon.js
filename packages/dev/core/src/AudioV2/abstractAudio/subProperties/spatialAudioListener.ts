import type { ISpatialAudioListenerOptions } from "./abstractSpatialAudioListener";
import { _SpatialAudioListenerDefaults, AbstractSpatialAudioListener } from "./abstractSpatialAudioListener";

/** @internal */
export abstract class _SpatialAudioListener extends AbstractSpatialAudioListener {
    private _attacher: _ExclusiveSpatialAudioAttacher;

    protected constructor() {
        super();

        this._attacher = new _ExclusiveSpatialAudioAttacher(this);
    }

    /** @internal */
    public get attachedCamera(): Nullable<Camera> {
        return this._attacher.attachedCamera;
    }

    public set attachedCamera(value: Nullable<Camera>) {
        this._attacher.attachedCamera = value;
    }

    /** @internal */
    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._attacher.attachedMesh;
    }

    /** @internal */
    public set attachedMesh(value: Nullable<AbstractMesh>) {
        this._attacher.attachedMesh = value;
    }

    /** @internal */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._attacher.attachedTransformNode;
    }

    /** @internal */
    public set attachedTransformNode(value: Nullable<TransformNode>) {
        this._attacher.attachedTransformNode = value;
    }

    /** @internal */
    public get attachmentType(): SpatialAudioAttachmentType {
        return this._attacher.attachmentType;
    }

    public set attachmentType(value: SpatialAudioAttachmentType) {
        this._attacher.attachmentType = value;
    }

    /** @internal */
    public get isAttached(): boolean {
        return this._attacher.isAttached;
    }

    /** @internal */
    public get isAttachedToPosition(): boolean {
        return this._attacher.isAttachedToPosition;
    }

    /** @internal */
    public get isAttachedToRotation(): boolean {
        return this._attacher.isAttachedToRotation;
    }

    /**
     * Detaches the audio source from the currently attached camera, mesh or transform node.
     */
    public detach(): void {
        this._attacher.detach();
    }

    /** @internal */
    public dispose(): void {
        this._attacher.dispose();
    }

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioListenerOptions>): Promise<void> {
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

        if (options.listenerPosition !== undefined) {
            this.position = options.listenerPosition.clone();
        }

        if (options.listenerRotationQuaternion !== undefined) {
            this.rotationQuaternion = options.listenerRotationQuaternion.clone();
        } else if (options.listenerRotation !== undefined) {
            this.rotation = options.listenerRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioListenerDefaults.rotationQuaternion.clone();
        }

        return this._attacher.isReadyPromise;
    }
}
