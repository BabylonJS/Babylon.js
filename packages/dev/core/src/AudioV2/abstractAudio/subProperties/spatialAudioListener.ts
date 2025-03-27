import type { Node } from "../../../node";
import type { Nullable } from "../../../types";
import { SpatialAudioAttachmentType } from "../../spatialAudioAttachmentType";
import { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import type { ISpatialAudioListenerOptions } from "./abstractSpatialAudioListener";
import { _SpatialAudioListenerDefaults, AbstractSpatialAudioListener } from "./abstractSpatialAudioListener";

/** @internal */
export abstract class _SpatialAudioListener extends AbstractSpatialAudioListener {
    protected _attacherComponent: Nullable<_SpatialAudioAttacherComponent> = null;

    protected constructor() {
        super();

        this._attacherComponent = new _SpatialAudioAttacherComponent(this);
    }

    /** @internal */
    public get isAttached(): boolean {
        return this._attacherComponent !== null && this._attacherComponent.isAttached;
    }

    /**
     * Attaches to a scene node.
     *
     * Detaches automatically before attaching to the given scene node.
     * If `sceneNode` is `null` it is the same as calling `detach()`.
     *
     * @param sceneNode The scene node to attach to, or `null` to detach.
     * @param useBoundingBox Whether to use the bounding box of the node for positioning. Defaults to `false`.
     * @param attachmentType Whether to attach to the node's position and/or rotation. Defaults to `PositionAndRotation`.
     */
    public attach(sceneNode: Nullable<Node>, useBoundingBox: boolean = false, attachmentType: SpatialAudioAttachmentType = SpatialAudioAttachmentType.PositionAndRotation): void {
        if (!this._attacherComponent) {
            this._attacherComponent = new _SpatialAudioAttacherComponent(this);
        }
        this._attacherComponent.attach(sceneNode, useBoundingBox, attachmentType);
    }

    /**
     * Detaches from the scene node if attached.
     */
    public detach(): void {
        this._attacherComponent?.detach();
    }

    /** @internal */
    public dispose(): void {
        this._attacherComponent?.dispose();
        this._attacherComponent = null;
    }

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioListenerOptions>): void {
        if (options.listenerMinUpdateTime !== undefined) {
            this.minUpdateTime = options.listenerMinUpdateTime;
        }

        if (options.listenerPosition) {
            this.position = options.listenerPosition.clone();
        }

        if (options.listenerRotationQuaternion) {
            this.rotationQuaternion = options.listenerRotationQuaternion.clone();
        } else if (options.listenerRotation) {
            this.rotation = options.listenerRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioListenerDefaults.rotationQuaternion.clone();
        }

        this.update();
    }

    public abstract _updatePosition(): void;
    public abstract _updateRotation(): void;
}
