import type { Quaternion, Vector3 } from "../../Maths/math.vector";
import type { TransformNode } from "../../Meshes/transformNode";
import type { Nullable } from "../../types";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { SpatialAudioListener } from "./spatialAudioListener";
import type { ISpatialAudioTransformOptions } from "./spatialAudioTransform";
import { SpatialAudioTransform } from "./spatialAudioTransform";

/**
 * Options for creating a new audio positioner.
 */
export interface IAudioPositionerOptions extends ISpatialAudioTransformOptions {}

/**
 * Abstract base class for audio positioners.
 */
export abstract class AudioPositioner extends AbstractAudioNode {
    // Not owned
    private _pannerGain: number = 1;
    private _pannerPosition: Nullable<Vector3> = null;
    private _spatialTransform: SpatialAudioTransform;
    private _spatializerGain: number = 1;

    // TODO: Add spatializer cone angles/volumes, etc ...

    /**
     * The spatial audio listeners.
     */
    public readonly listeners = new Set<SpatialAudioListener>();

    /** @internal */
    constructor(parent: AbstractAudioNode, options: Nullable<ISpatialAudioTransformOptions> = null) {
        super(parent.engine, AudioNodeType.InputOutput, parent);

        this._spatialTransform = new SpatialAudioTransform(options);
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._spatialTransform.dispose();

        this.listeners?.clear();
    }

    /**
     * The position of the audio positioner.
     */
    public get position(): Vector3 {
        return this._spatialTransform.position;
    }

    public set position(position: Vector3) {
        this._spatialTransform.position = position;
    }

    /**
     * The rotation of the audio positioner.
     */
    public get rotation(): Quaternion {
        return this._spatialTransform.rotation;
    }

    public set rotation(rotation: Quaternion) {
        this._spatialTransform.rotation = rotation;
    }

    /**
     * The scale of the audio positioner.
     */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._spatialTransform.attachedTransformNode;
    }

    public set attachedTransformNode(node: Nullable<TransformNode>) {
        this._spatialTransform.attachedTransformNode = node;
    }

    /**
     * The spatializer gain of the audio positioner.
     */
    public get spatializerGain(): number {
        return this._spatializerGain;
    }

    public set spatializerGain(value: number) {
        this._spatializerGain = value;
    }

    /**
     * The panner gain of the audio positioner.
     */
    public get pannerGain(): number {
        return this._pannerGain;
    }

    public set pannerGain(value: number) {
        this._pannerGain = value;
    }

    /**
     * The panner position of the audio positioner.
     */
    public get pannerPosition(): Nullable<Vector3> {
        return this._pannerPosition;
    }

    public set pannerPosition(value: Nullable<Vector3>) {
        this._pannerPosition = value;
    }
}
