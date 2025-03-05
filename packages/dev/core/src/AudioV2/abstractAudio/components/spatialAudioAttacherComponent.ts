import type { Camera } from "../../../Cameras/camera";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { _AbstractSpatialAudioAttacher } from "../spatialAttachers/abstractSpatialAudioAttacher";
import { _SpatialAudioCameraAttacher } from "../spatialAttachers/spatialAudioCameraAttacher";
import { _SpatialAudioMeshAttacher } from "../spatialAttachers/spatialAudioMeshAttacher";
import { _SpatialAudioTransformNodeAttacher } from "../spatialAttachers/spatialAudioTransformNodeAttacher";
import type { _SpatialAudioSubNode } from "../subNodes/spatialAudioSubNode";
import type { _SpatialAudioListener } from "../subProperties/spatialAudioListener";

export const _SpatialAudioAttachedEntity = {
    CAMERA: "Camera",
    MESH: "Mesh",
    TRANSFORM_NODE: "TransformNode",
} as const;

export const enum SpatialAudioAttachmentType {
    POSITION = 1,
    ROTATION = 2,
    POSITION_AND_ROTATION = 3,
}

/**
 * Provides a common interface for attaching an audio listener or source to a specific entity, ensuring only one entity
 * is attached at a time.
 * @internal
 */
export class _SpatialAudioAttacherComponent {
    private _attachedEntity: Nullable<AbstractMesh | Camera | TransformNode> = null;
    private _attacher: Nullable<_AbstractSpatialAudioAttacher> = null;

    /**
     * The type of attachment to use; position, rotation, or both.
     */
    public attachmentType: SpatialAudioAttachmentType = SpatialAudioAttachmentType.POSITION_AND_ROTATION;

    /** @internal */
    public readonly _spatialAudioNode: _SpatialAudioSubNode | _SpatialAudioListener;

    /**
     * Creates a new ExclusiveSpatialAudioAttacher.
     * @param spatialAudioNode - The spatial audio node to attach to
     */
    public constructor(spatialAudioNode: _SpatialAudioSubNode | _SpatialAudioListener) {
        this._spatialAudioNode = spatialAudioNode;
    }

    /**
     * The scene that the audio listener or source is attached to, or null if the audio listener or source is not
     * attached to a scene.
     */
    public get attachedCamera(): Nullable<Camera> {
        return this._attacher?.getClassName() === _SpatialAudioAttachedEntity.CAMERA ? (this._attachedEntity as Camera) : null;
    }

    public set attachedCamera(value: Nullable<Camera>) {
        if (this.attachedCamera === value) {
            return;
        }

        this._resetAttachedEntity(value, _SpatialAudioAttachedEntity.CAMERA);
    }

    /**
     * The mesh that the audio listener or source is attached to, or null if the audio listener or source is not
     * attached to a mesh.
     */
    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._attacher?.getClassName() === _SpatialAudioAttachedEntity.MESH ? (this._attachedEntity as AbstractMesh) : null;
    }

    public set attachedMesh(value: Nullable<AbstractMesh>) {
        if (this.attachedMesh === value) {
            return;
        }

        this._resetAttachedEntity(value, _SpatialAudioAttachedEntity.MESH);
    }

    /**
     * The transform node that the audio listener or source is attached to, or null if the audio listener or source is
     * not attached to a transform node.
     */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._attacher?.getClassName() === _SpatialAudioAttachedEntity.TRANSFORM_NODE ? (this._attachedEntity as TransformNode) : null;
    }

    public set attachedTransformNode(value: Nullable<TransformNode>) {
        if (this.attachedTransformNode === value) {
            return;
        }

        this._resetAttachedEntity(value, _SpatialAudioAttachedEntity.TRANSFORM_NODE);
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
        return this._attacher !== null && (this.attachmentType & SpatialAudioAttachmentType.POSITION) === SpatialAudioAttachmentType.POSITION;
    }

    /**
     * Returns `true` if the audio listener or source is attached to an entity's rotation; otherwise returns `false`.
     */
    public get isAttachedToRotation(): boolean {
        return this._attacher !== null && (this.attachmentType & SpatialAudioAttachmentType.ROTATION) === SpatialAudioAttachmentType.ROTATION;
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

    /**
     * Updates the audio listener or source.
     */
    public update() {
        this._attacher?.update(true);
    }

    private _resetAttachedEntity(entity: Nullable<AbstractMesh | Camera | TransformNode>, attacherClassName: string): void {
        this.detach();

        this._attachedEntity = entity;

        if (!entity) {
            this._attacher = null;
        } else {
            switch (attacherClassName) {
                case _SpatialAudioAttachedEntity.CAMERA:
                    this._attacher = new _SpatialAudioCameraAttacher(this);
                    break;
                case _SpatialAudioAttachedEntity.MESH:
                    this._attacher = new _SpatialAudioMeshAttacher(this);
                    break;
                case _SpatialAudioAttachedEntity.TRANSFORM_NODE:
                    this._attacher = new _SpatialAudioTransformNodeAttacher(this);
                    break;
                default:
                    this._attacher = null;
                    break;
            }
        }

        return;
    }
}
