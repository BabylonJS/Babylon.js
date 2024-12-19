import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import { _AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export class _SpatialAudio {
    /** @internal */
    public static readonly DefaultConeInnerAngle = 360;
    /** @internal */
    public static readonly DefaultConeOuterAngle = 360;
    /** @internal */
    public static readonly DefaultConeOuterVolume = 0;
    /** @internal */
    public static readonly DefaultDistanceModel = "inverse";
    /** @internal */
    public static readonly DefaultMaxDistance = 10000;
    /** @internal */
    public static readonly DefaultPanningModel = "equalpower";
}

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioOptions {
    /**
     * The spatial cone inner angle. Default is 360.
     */
    spatialConeInnerAngle?: number;
    /**
     * The spatial cone outer angle. Default is 360.
     */
    spatialConeOuterAngle?: number;
    /**
     * The spatial cone outer gain. Default is 0.
     */
    spatialConeOuterVolume?: number;
    /**
     * The spatial distance model. Default is "inverse".
     */
    spatialDistanceModel?: "linear" | "inverse" | "exponential";
    /**
     * Enable spatial audio. Default is false.
     */
    spatialEnabled?: boolean;
    /**
     * The spatial max distance. Default is 10000.
     */
    spatialMaxDistance?: number;
    /**
     * The spatial panning model. Default is "equalpower".
     */
    spatialPanningModel?: "equalpower" | "HRTF";
    /**
     * The spatial position. Default is (0, 0, 0).
     */
    spatialPosition?: Vector3;
    /**
     * The spatial ref distance. Default is 1.
     */
    spatialRefDistance?: number;
    /**
     * The spatial rolloff factor. Default is 1.
     */
    spatialRolloffFactor?: number;
    /**
     * The spatial rotation.
     */
    spatialRotation?: Quaternion;
    /**
     * The transform node to track spatially.
     */
    spatialTransformNode?: TransformNode;
}

/**
 * @param options The spatial audio options to check.
 * @returns `true` if spatial audio options are defined, otherwise `false`.
 */
export function _hasSpatialAudioOptions(options: ISpatialAudioOptions): boolean {
    return (
        options.spatialEnabled ||
        options.spatialConeInnerAngle !== undefined ||
        options.spatialConeOuterAngle !== undefined ||
        options.spatialConeOuterVolume !== undefined ||
        options.spatialDistanceModel !== undefined ||
        options.spatialMaxDistance !== undefined ||
        options.spatialPanningModel !== undefined ||
        options.spatialPosition !== undefined ||
        options.spatialRefDistance !== undefined ||
        options.spatialRolloffFactor !== undefined ||
        options.spatialRotation !== undefined ||
        options.spatialTransformNode !== undefined
    );
}

/** @internal */
export abstract class _SpatialAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.Spatial, engine);
    }

    public abstract get coneInnerAngle(): number;
    public abstract set coneInnerAngle(value: number);

    public abstract get coneOuterAngle(): number;
    public abstract set coneOuterAngle(value: number);

    public abstract get coneOuterVolume(): number;
    public abstract set coneOuterVolume(value: number);

    public abstract get distanceModel(): "linear" | "inverse" | "exponential";
    public abstract set distanceModel(value: "linear" | "inverse" | "exponential");

    public abstract get maxDistance(): number;
    public abstract set maxDistance(value: number);

    public abstract get panningModel(): "equalpower" | "HRTF";
    public abstract set panningModel(value: "equalpower" | "HRTF");

    public abstract get webAudioInputNode(): AudioNode;
    public abstract get webAudioOutputNode(): AudioNode;

    /** @internal */
    public setOptions(options: Nullable<ISpatialAudioOptions>): void {
        if (!options) {
            return;
        }

        this.coneInnerAngle = options.spatialConeInnerAngle !== undefined ? options.spatialConeInnerAngle : _SpatialAudio.DefaultConeInnerAngle;
        this.coneOuterAngle = options.spatialConeOuterAngle !== undefined ? options.spatialConeOuterAngle : _SpatialAudio.DefaultConeOuterAngle;
        this.coneOuterVolume = options.spatialConeOuterVolume !== undefined ? options.spatialConeOuterVolume : _SpatialAudio.DefaultConeOuterVolume;
        this.distanceModel = options.spatialDistanceModel !== undefined ? options.spatialDistanceModel : _SpatialAudio.DefaultDistanceModel;
        this.maxDistance = options.spatialMaxDistance !== undefined ? options.spatialMaxDistance : _SpatialAudio.DefaultMaxDistance;
        this.panningModel = options.spatialPanningModel !== undefined ? options.spatialPanningModel : _SpatialAudio.DefaultPanningModel;
    }
}
