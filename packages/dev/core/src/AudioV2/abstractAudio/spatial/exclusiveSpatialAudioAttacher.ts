import type { Camera } from "../../../Cameras/camera";
import type { AbstractMesh, TransformNode } from "../../../Meshes";
import type { Nullable } from "../../../types";
import type { _AbstractSpatialAudioAttacher, ISpatialAudioNode } from "./abstractSpatialAudioAttacher";
import { _SpatialAudioAttacher } from "./spatialAudioAttacher";
import { _CreateSpatialAudioMeshAttacherAsync } from "./spatialAudioMeshAttacher";

/**
 * Provides a common interface for attaching an audio listener or source to a specific entity, ensuring that only one
 * entity has the audio listener or source attached at a time.
 */
export class _ExclusiveSpatialAudioAttacher {
    private _attachedEntity: Nullable<AbstractMesh | Camera | TransformNode> = null;
    private _attacher: Nullable<_AbstractSpatialAudioAttacher> = null;
    private _createAttacherPromise: Nullable<Promise<_AbstractSpatialAudioAttacher>> = null;
    private _spatialAudioNode: ISpatialAudioNode;

    /**
     * Creates a new ExclusiveSpatialAudioAttacher.
     * @param spatialAudioNode - The spatial audio node to attach to
     */
    public constructor(spatialAudioNode: ISpatialAudioNode) {
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

        this._resetAttachedEntity(value, _SpatialAudioAttacher.CAMERA);
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

        this._resetAttachedEntity(value, _SpatialAudioAttacher.MESH);
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

        this._resetAttachedEntity(value, _SpatialAudioAttacher.TRANSFORM_NODE);
    }

    /**
     * Releases associated resources.
     */
    public dispose() {
        this._clearAttacher();
    }

    private _clearAttacher() {
        this._attacher?.dispose();
        this._attacher = null;
        this._createAttacherPromise = null;
    }

    private _createAttacher(attacherClassName: string): Nullable<Promise<_AbstractSpatialAudioAttacher>> {
        switch (attacherClassName) {
            case _SpatialAudioAttacher.CAMERA:
                return null;
            case _SpatialAudioAttacher.MESH:
                return this.attachedMesh ? _CreateSpatialAudioMeshAttacherAsync(this.attachedMesh, this._spatialAudioNode) : null;
            case _SpatialAudioAttacher.TRANSFORM_NODE:
                return null;
        }
        return null;
    }

    private _resetAttachedEntity(entity: Nullable<AbstractMesh | Camera | TransformNode>, attacherClassName: string) {
        this._clearAttacher();

        this._attachedEntity = entity;

        this._createAttacherPromise = this._createAttacher(attacherClassName);

        if (this._createAttacherPromise) {
            this._createAttacherPromise.then((attacher) => {
                this._attacher = attacher;
            });
        }
    }
}
