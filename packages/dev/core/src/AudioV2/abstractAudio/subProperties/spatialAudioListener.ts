import type { Camera } from "../../../Cameras/camera";
import type { AbstractMesh, TransformNode } from "../../../Meshes";
import type { Nullable } from "../../../types";
import { _ExclusiveSpatialAudioAttacher } from "../spatial/exclusiveSpatialAudioAttacher";
import { _SpatialAudioListenerDefaults, AbstractSpatialAudioListener, type ISpatialAudioListenerOptions } from "./abstractSpatialAudioListener";

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
            this.rotationQuaternion = _SpatialAudioListenerDefaults.ROTATION_QUATERNION.clone();
        }

        return this._attacher.isReadyPromise;
    }
}
