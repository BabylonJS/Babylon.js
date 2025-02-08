import type { Camera } from "../../../Cameras/camera";
import type { AbstractMesh, TransformNode } from "../../../Meshes";
import type { Nullable } from "../../../types";
import type { _AbstractSpatialAudioAttacher, ISpatialAudioNode } from "./abstractSpatialAudioAttacher";
import { _SpatialAudioAttacher, SpatialAudioAttachmentType } from "./spatialAudioAttacher";
import { _CreateSpatialAudioCameraAttacherAsync } from "./spatialAudioCameraAttacher";
import { _CreateSpatialAudioMeshAttacherAsync } from "./spatialAudioMeshAttacher";
import { _CreateSpatialAudioTransformNodeAttacherAsync } from "./spatialAudioTransformNodeAttacher";

/**
 * Provides a common interface for attaching an audio listener or source to a specific entity, ensuring that only one
 * entity has the audio listener or source attached at a time.
 */
export class _ExclusiveSpatialAudioAttacher {
    private _attachedEntity: Nullable<AbstractMesh | Camera | TransformNode> = null;
    private _attacher: Nullable<_AbstractSpatialAudioAttacher> = null;
    private _attachmentType: SpatialAudioAttachmentType;
    private _isReadyPromise: Nullable<Promise<void>> = null;
    private _minUpdateTime: number = 0;
    private _spatialAudioNode: ISpatialAudioNode;

    /**
     * Creates a new ExclusiveSpatialAudioAttacher.
     * @param spatialAudioNode - The spatial audio node to attach to
     * @param attachmentType - The type of attachment to use; position, rotation or both. Defaults to both
     */
    public constructor(spatialAudioNode: ISpatialAudioNode, attachmentType: SpatialAudioAttachmentType = SpatialAudioAttachmentType.POSITION_AND_ROTATION) {
        this._attachmentType = attachmentType;
        this._spatialAudioNode = spatialAudioNode;
    }

    /**
     * The scene that the audio listener or source is attached to, or null if the audio listener or source is not
     * attached to a scene.
     */
    public get attachedCamera(): Nullable<Camera> {
        return this._attacher?.getClassName() === _SpatialAudioAttacher.CAMERA ? (this._attachedEntity as Camera) : null;
    }

    public set attachedCamera(value: Nullable<Camera>) {
        if (this.attachedCamera === value) {
            return;
        }

        this._isReadyPromise = this._resetAttachedEntity(value, _SpatialAudioAttacher.CAMERA);
    }

    /**
     * The mesh that the audio listener or source is attached to, or null if the audio listener or source is not
     * attached to a mesh.
     */
    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._attacher?.getClassName() === _SpatialAudioAttacher.MESH ? (this._attachedEntity as AbstractMesh) : null;
    }

    public set attachedMesh(value: Nullable<AbstractMesh>) {
        if (this.attachedMesh === value) {
            return;
        }

        this._isReadyPromise = this._resetAttachedEntity(value, _SpatialAudioAttacher.MESH);
    }

    /**
     * The transform node that the audio listener or source is attached to, or null if the audio listener or source is
     * not attached to a transform node.
     */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._attacher?.getClassName() === _SpatialAudioAttacher.TRANSFORM_NODE ? (this._attachedEntity as TransformNode) : null;
    }

    public set attachedTransformNode(value: Nullable<TransformNode>) {
        if (this.attachedTransformNode === value) {
            return;
        }

        this._isReadyPromise = this._resetAttachedEntity(value, _SpatialAudioAttacher.TRANSFORM_NODE);
    }

    /**
     * The type of attachment to use; position, rotation, or both.
     */
    public get attachmentType(): SpatialAudioAttachmentType {
        return this._attachmentType;
    }

    public set attachmentType(value: SpatialAudioAttachmentType) {
        if (this._attachmentType === value) {
            return;
        }

        this._attachmentType = value;

        if (this._attacher) {
            this._attacher.attachmentType = value;
        }
    }

    /**
     * Returns `true` if the audio listener or source is attached to an entity; otherwise returns `false`.
     */
    public get isAttached(): boolean {
        return this._attacher !== null;
    }

    /**
     * Returns `true` if the audio listener or source is attached to an entity's position; otherwise returns `false`.
     */
    public get isAttachedToPosition(): boolean {
        return this._attacher !== null && (this._attacher.attachmentType & SpatialAudioAttachmentType.POSITION) === SpatialAudioAttachmentType.POSITION;
    }

    /**
     * Returns `true` if the audio listener or source is attached to an entity's rotation; otherwise returns `false`.
     */
    public get isAttachedToRotation(): boolean {
        return this._attacher !== null && (this._attacher.attachmentType & SpatialAudioAttachmentType.ROTATION) === SpatialAudioAttachmentType.ROTATION;
    }

    /**
     * A promise that resolves when the attacher is ready.
     */
    public get isReadyPromise(): Promise<void> {
        return this._isReadyPromise ?? Promise.resolve();
    }

    /**
     * The minimum time in seconds between updates to the audio listener or source.
     */
    public get minUpdateTime(): number {
        return this._minUpdateTime;
    }

    public set minUpdateTime(value: number) {
        if (this._minUpdateTime === value) {
            return;
        }

        this._minUpdateTime = value;

        if (this._attacher) {
            this._attacher.minUpdateTime = value;
        }
    }

    /**
     * Detaches the attached entity.
     */
    public detach() {
        this._attacher?.dispose();
        this._attacher = null;
    }

    /**
     * Releases associated resources.
     */
    public dispose() {
        this.detach();
    }

    private _createAttacher(attacherClassName: string): Nullable<Promise<_AbstractSpatialAudioAttacher>> {
        switch (attacherClassName) {
            case _SpatialAudioAttacher.CAMERA:
                return this._attachedEntity
                    ? _CreateSpatialAudioCameraAttacherAsync(this._attachedEntity as Camera, this._spatialAudioNode, this._attachmentType, this._minUpdateTime)
                    : null;
            case _SpatialAudioAttacher.MESH:
                return this._attachedEntity
                    ? _CreateSpatialAudioMeshAttacherAsync(this._attachedEntity as AbstractMesh, this._spatialAudioNode, this._attachmentType, this._minUpdateTime)
                    : null;
            case _SpatialAudioAttacher.TRANSFORM_NODE:
                return this._attachedEntity
                    ? _CreateSpatialAudioTransformNodeAttacherAsync(this._attachedEntity as TransformNode, this._spatialAudioNode, this._attachmentType, this._minUpdateTime)
                    : null;
        }
        return null;
    }

    private async _resetAttachedEntity(entity: Nullable<AbstractMesh | Camera | TransformNode>, attacherClassName: string): Promise<void> {
        this.detach();

        this._attachedEntity = entity;
        this._attacher = await this._createAttacher(attacherClassName);

        return;
    }
}
