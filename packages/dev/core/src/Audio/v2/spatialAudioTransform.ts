import { Quaternion, Vector3 } from "../../Maths/math.vector";
import type { TransformNode } from "../../Meshes";
import type { IDisposable } from "../../scene";
import type { Nullable } from "../../types";

/**
 * Options for creating a new spatial audio transform.
 */
export interface SpatialAudioTransformOptions {
    /**
     * The position of the transform.
     */
    position?: Vector3;
    /**
     * The rotation of the transform.
     */
    rotation?: Quaternion;
    /**
     * The transform node to attach to.
     */
    attachedTransformNode?: Nullable<TransformNode>;
}

/** @internal */
export class SpatialAudioTransform implements IDisposable {
    private _attachedTransformNode: Nullable<TransformNode> = null;
    private _position: Vector3;
    private _positionDirty: boolean = false;
    private _rotation: Quaternion;
    private _rotationDirty: boolean = false;

    /** @internal */
    constructor(options: Nullable<SpatialAudioTransformOptions> = null) {
        this._position = options?.position ?? Vector3.Zero();
        this._rotation = options?.rotation ?? Quaternion.Identity();
        this._attachedTransformNode = options?.attachedTransformNode ?? null;
    }

    /** @internal */
    public dispose(): void {
        this._detachFromTransformNode();
        this._attachedTransformNode = null;
    }

    /** @internal */
    public get position(): Vector3 {
        this._updatePosition();
        return this._position;
    }

    public set position(position: Vector3) {
        this._position.copyFrom(position);
    }

    /** @internal */
    public get rotation(): Quaternion {
        this._updateRotation();
        return this._rotation;
    }

    public set rotation(rotation: Quaternion) {
        this._rotation.copyFrom(rotation);
    }

    /** @internal */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._attachedTransformNode;
    }

    public set attachedTransformNode(node: Nullable<TransformNode>) {
        this._detachFromTransformNode();

        this._attachedTransformNode = node;

        if (node) {
            node.onAfterWorldMatrixUpdateObservable.add(this._onAttachedTransformNodeWorldMatrixUpdated.bind(this));
            this._positionDirty = true;
            this._rotationDirty = true;
        } else {
            this._positionDirty = false;
            this._rotationDirty = false;
        }
    }

    private _detachFromTransformNode() {
        if (this._attachedTransformNode) {
            this._attachedTransformNode.onAfterWorldMatrixUpdateObservable.removeCallback(this._onAttachedTransformNodeWorldMatrixUpdated);
        }
    }

    private _onAttachedTransformNodeWorldMatrixUpdated(): void {
        this._positionDirty = true;
        this._rotationDirty = true;
    }

    private _updatePosition() {
        if (!this._positionDirty) {
            return;
        }
        this._positionDirty = false;

        this._attachedTransformNode!.getWorldMatrix().decompose(undefined, undefined, this._position);
    }

    private _updateRotation() {
        if (!this._rotationDirty) {
            return;
        }
        this._rotationDirty = false;

        this._attachedTransformNode!.getWorldMatrix().decompose(undefined, this._rotation);
    }
}
