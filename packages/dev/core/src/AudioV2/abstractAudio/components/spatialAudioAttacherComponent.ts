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
     * Returns `true` if the audio listener or source is attached to an entity; otherwise returns `false`.
     */
    public get isAttached(): boolean {
        return this._sceneNode !== null;
    }

    /**
     * Attaches a scene object.
     * @param sceneNode The scene node to attach to.
     * @param useBoundingBox Whether to use the bounding box of the node for positioning. Defaults to `false`.
     * @param attachmentType Whather to attach to the node's position and/or rotation. Defaults to `PositionAndRotation`.
     */
    public attach(sceneNode: Node, useBoundingBox: boolean, attachmentType: SpatialAudioAttachmentType): void {
        this.detach();

        this._attachmentType = attachmentType;

        this._sceneNode = sceneNode;
        this._sceneNode.onDisposeObservable.add(this.dispose);

        this._useBoundingBox = useBoundingBox;
    }

    /**
     * Detaches the attached entity.
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
     * Updates the audio listener or source.
     */
    public update() {
        let rotationDone = false;

        if (this._attachmentType & SpatialAudioAttachmentType.Position) {
            if (this._useBoundingBox && (this._sceneNode as AbstractMesh).getBoundingInfo) {
                this._position.copyFrom((this._sceneNode as AbstractMesh).getBoundingInfo().boundingBox.centerWorld);
            } else if ((this._sceneNode as any).position) {
                this._position.copyFrom((this._sceneNode as any).position);
            } else {
                rotationDone = 0 < (this._attachmentType & SpatialAudioAttachmentType.Rotation);
                const rotationQuaternion = rotationDone ? this._rotationQuaternion : undefined;
                this._sceneNode?.getWorldMatrix().decompose(this._position, rotationQuaternion, undefined);
            }

            this._spatialAudioNode.position = this._position;
        }

        if (this._attachmentType & SpatialAudioAttachmentType.Rotation) {
            if (!rotationDone) {
                this._sceneNode?.getWorldMatrix().decompose(undefined, this._rotationQuaternion, undefined);
            }

            this._spatialAudioNode.rotationQuaternion = this._rotationQuaternion;
        }
    }
}
