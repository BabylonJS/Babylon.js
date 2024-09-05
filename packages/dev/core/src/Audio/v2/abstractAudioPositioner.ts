/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { SpatialAudioListener } from "./spatialAudioListener";
import type { ISpatialAudioTransformOptions } from "./spatialAudioTransform";
import { SpatialAudioTransform } from "./spatialAudioTransform";
import type { Quaternion, Vector3 } from "../../Maths/math.vector";
import type { TransformNode } from "../../Meshes";
import type { Nullable } from "../../types";

export interface IAudioPositionerOptions extends ISpatialAudioTransformOptions {}

export abstract class AbstractAudioPositioner extends AbstractAudioNode {
    public constructor(parent: AbstractAudioNode, options?: ISpatialAudioTransformOptions) {
        super(parent.engine, AudioNodeType.InputOutput, parent);

        this._spatialTransform = new SpatialAudioTransform(options);
    }

    public override dispose(): void {
        this._spatialTransform.dispose();

        this._listeners?.clear();
        this._listeners = null;

        super.dispose();
    }

    // Not owned
    private _listeners: Nullable<Set<SpatialAudioListener>> = null;

    /** @internal */
    public _addListener(listener: SpatialAudioListener): void {
        if (!this._listeners) {
            this._listeners = new Set();
        }

        this._listeners.add(listener);
    }

    /** @internal */
    public _removeListener(listener: SpatialAudioListener): void {
        this._listeners?.delete(listener);
    }

    private _spatialTransform: SpatialAudioTransform;

    public get position(): Vector3 {
        return this._spatialTransform.position;
    }

    public set position(position: Vector3) {
        this._spatialTransform.position = position;
    }

    public get rotation(): Quaternion {
        return this._spatialTransform.rotation;
    }

    public set rotation(rotation: Quaternion) {
        this._spatialTransform.rotation = rotation;
    }

    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._spatialTransform.attachedTransformNode;
    }

    public set attachedTransformNode(node: Nullable<TransformNode>) {
        this._spatialTransform.attachedTransformNode = node;
    }

    private _spatializerGain: number = 1;
    // TODO: Add spatializer cone angles/volumes, etc ...

    public get spatializerGain(): number {
        return this._spatializerGain;
    }

    public set spatializerGain(value: number) {
        this._spatializerGain = value;
    }

    private _pannerGain: number = 1;

    public get pannerGain(): number {
        return this._pannerGain;
    }

    public set pannerGain(value: number) {
        this._pannerGain = value;
    }

    private _pannerPosition: Nullable<Vector3> = null;

    public get pannerPosition(): Nullable<Vector3> {
        return this._pannerPosition;
    }

    public set pannerPosition(value: Nullable<Vector3>) {
        this._pannerPosition = value;
    }
}
