import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { Node } from "../../../node";
import type { Nullable } from "../../../types";
import { SpatialAudioAttachmentType } from "../../spatialAudioAttachmentType";
import type { _SpatialAudioSubNode } from "../subNodes/spatialAudioSubNode";
import type { _SpatialAudioListener } from "../subProperties/spatialAudioListener";

/**
 * Provides a common interface for attaching an audio listener or source to a specific entity, ensuring only one entity
 * is attached at a time.
 * @internal
 */
export class _SpatialAudioAttacherComponent {
    /** @internal */
    private _attachmentType: SpatialAudioAttachmentType = SpatialAudioAttachmentType.PositionAndRotation;
    private readonly _position = new Vector3();
    private readonly _rotationQuaternion = new Quaternion();
    private _sceneNode: Nullable<Node> = null;
    private readonly _spatialAudioNode: _SpatialAudioSubNode | _SpatialAudioListener;
    private _useBoundingBox: boolean = false;

    /** @internal */
    public constructor(spatialAudioNode: _SpatialAudioSubNode | _SpatialAudioListener) {
        this._spatialAudioNode = spatialAudioNode;
    }

    /**
     * Returns `true` if attached to a scene node; otherwise returns `false`.
     */
    public get isAttached(): boolean {
        return this._sceneNode !== null;
    }

    /**
     * Attaches to a scene node.
     *
     * Detaches automatically before attaching to the given scene node.
     * If `sceneNode` is `null` it is the same as calling `detach()`.
     *
     * @param sceneNode The scene node to attach to, or `null` to detach.
     * @param useBoundingBox Whether to use the scene node's bounding box for positioning. Defaults to `false`.
     * @param attachmentType Whether to attach to the scene node's position and/or rotation. Defaults to `PositionAndRotation`.
     */
    public attach(sceneNode: Nullable<Node>, useBoundingBox: boolean, attachmentType: SpatialAudioAttachmentType): void {
        if (this._sceneNode === sceneNode) {
            return;
        }

        this.detach();

        if (!sceneNode) {
            return;
        }

        this._attachmentType = attachmentType;

        this._sceneNode = sceneNode;
        this._sceneNode.onDisposeObservable.add(this.dispose);

        this._useBoundingBox = useBoundingBox;
    }

    /**
     * Detaches from the scene node if attached.
     */
    public detach() {
        this._sceneNode?.onDisposeObservable.removeCallback(this.dispose);
        this._sceneNode = null;
    }

    /**
     * Releases associated resources.
     */
    public dispose = () => {
        this.detach();
    };

    /**
     * Updates the position and rotation of the associated audio engine object in the audio rendering graph.
     *
     * This is called automatically by default and only needs to be called manually if automatic updates are disabled.
     */
    public update() {
        if (this._attachmentType & SpatialAudioAttachmentType.Position) {
            if (this._useBoundingBox && (this._sceneNode as AbstractMesh).getBoundingInfo) {
                this._position.copyFrom((this._sceneNode as AbstractMesh).getBoundingInfo().boundingBox.centerWorld);
            } else {
                this._sceneNode?.getWorldMatrix().getTranslationToRef(this._position);
            }

            this._spatialAudioNode.position.copyFrom(this._position);
            this._spatialAudioNode._updatePosition();
        }

        if (this._attachmentType & SpatialAudioAttachmentType.Rotation) {
            this._sceneNode?.getWorldMatrix().decompose(undefined, this._rotationQuaternion);

            this._spatialAudioNode.rotationQuaternion.copyFrom(this._rotationQuaternion);
            this._spatialAudioNode._updateRotation();
        }
    }
}
