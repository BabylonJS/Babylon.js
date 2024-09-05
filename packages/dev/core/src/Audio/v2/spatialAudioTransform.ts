/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { Quaternion, Vector3 } from "../../Maths";
import type { TransformNode } from "../..//Meshes";
import type { IDisposable } from "../../scene";
import type { Nullable } from "../../types";

export interface ISpatialAudioTransformOptions {
    position?: Vector3;
    rotation?: Quaternion;
    attachedTransformNode?: Nullable<TransformNode>;
}

export class SpatialAudioTransform implements IDisposable {
    private _attachedTransformNode: Nullable<TransformNode> = null;
    private _position: Vector3;
    private _positionDirty: boolean = false;
    private _rotation: Quaternion;
    private _rotationDirty: boolean = false;

    public constructor(options?: ISpatialAudioTransformOptions) {
        this._position = options?.position ?? Vector3.Zero();
        this._rotation = options?.rotation ?? Quaternion.Identity();
        this._attachedTransformNode = options?.attachedTransformNode ?? null;
    }

    public dispose(): void {
        this._detachFromTransformNode();
        this._attachedTransformNode = null;
    }

    public get position(): Vector3 {
        this._updatePosition();
        return this._position;
    }

    public set position(position: Vector3) {
        this._position.copyFrom(position);
    }

    public get rotation(): Quaternion {
        this._updateRotation();
        return this._rotation;
    }

    public set rotation(rotation: Quaternion) {
        this._rotation.copyFrom(rotation);
    }

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
