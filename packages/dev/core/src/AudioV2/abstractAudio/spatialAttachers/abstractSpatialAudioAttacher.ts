import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Node } from "../../../node";
import type { Nullable } from "../../../types";
import type { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";

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

/** @internal */
export abstract class _AbstractSpatialAudioAttacher {
    private readonly _attacherComponent: _SpatialAudioAttacherComponent;
    private readonly _rotationQuaternion = new Quaternion();

    protected _node: Nullable<Node> = null;
    protected readonly _position = new Vector3();

    /** @internal */
    public constructor(attacherComponent: _SpatialAudioAttacherComponent) {
        this._attacherComponent = attacherComponent;
        this.node = attacherComponent.attachedNode;
    }

    /** @internal */
    public set node(value: Nullable<Node>) {
        if (this._node === value) {
            return;
        }

        this._clearNode();

        this._node = value;
        this._node?.onDisposeObservable.add(this.dispose);

        this.update();
    }

    protected abstract _attachedPosition: Vector3;

    protected get _attachedRotationQuaternion(): Quaternion {
        if (this._node) {
            this._node.getWorldMatrix().decompose(undefined, this._rotationQuaternion, undefined);
        } else {
            this._rotationQuaternion.copyFromFloats(0, 0, 0, 1);
        }
        return this._rotationQuaternion;
    }

    /** @internal */
    public dispose = () => {
        this._attacherComponent.detach();
        this._clearNode();
    };

    /** @internal */
    public abstract getAttacherType(): string;

    /** @internal */
    public update(): void {
        if (!this._attacherComponent._spatialAudioNode) {
            return;
        }

        if (this._attacherComponent.attachmentType & SpatialAudioAttachmentType.POSITION) {
            this._attacherComponent._spatialAudioNode.position = this._attachedPosition;
        }

        if (this._attacherComponent.attachmentType & SpatialAudioAttachmentType.ROTATION) {
            this._attacherComponent._spatialAudioNode.rotationQuaternion = this._attachedRotationQuaternion;
        }
    }

    protected _clearNode() {
        this._node?.onDisposeObservable.removeCallback(this.dispose);
        this._node = null;
    }
}
