import type { AbstractMesh, TransformNode } from "../../../Meshes";
import type { Scene } from "../../../scene";
import type { Nullable } from "../../../types";
import type { _AbstractSpatialAudioAttacher, ISpatialAudioNode } from "./abstractSpatialAudioAttacher";
import { _SpatialAudioAttacher } from "./spatialAudioAttacher";
import { _CreateSpatialAudioMeshAttacherAsync } from "./spatialAudioMeshAttacher";

/**
 * Attaches an audio listener or source to a specific entity, ensuring that only one entity has the audio listener or
 * source attached at a time.
 */
export class _ExclusiveSpatialAudioAttacher {
    private _attachedEntity: Nullable<AbstractMesh | Scene | TransformNode> = null;
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
     * The scene that the audio listener or source is attached to, or null if the audio listener or source is not
     * attached to a scene.
     */
    public get attachedScene(): Nullable<Scene> {
        return this._attacher?.getClassName() === _SpatialAudioAttacher.SCENE ? (this._attachedEntity as Scene) : null;
    }

    public set attachedScene(value: Nullable<Scene>) {
        if (this.attachedScene === value) {
            return;
        }

        this._resetAttachedEntity(value, _SpatialAudioAttacher.SCENE);
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
            case _SpatialAudioAttacher.MESH:
                return this.attachedMesh ? _CreateSpatialAudioMeshAttacherAsync(this.attachedMesh, this._spatialAudioNode) : null;
            case _SpatialAudioAttacher.SCENE:
                return null;
            case _SpatialAudioAttacher.TRANSFORM_NODE:
                return null;
        }
        return null;
    }

    private _resetAttachedEntity(entity: Nullable<AbstractMesh | Scene | TransformNode>, attacherClassName: string) {
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
