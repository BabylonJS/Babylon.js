import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import { AbstractAudioSubNode } from "../abstractAudioSubNode";
import type { IAudioParentNode } from "../audioParentNode";
import { AudioSubNode } from "./audioSubNode";

export enum SpatialAudio {
    DefaultConeInnerAngle = 360,
    DefaultConeOuterAngle = 360,
    DefaultConeOuterVolume = 0,
    DefaultDistanceModel = "inverse",
    DefaultMaxDistance = 10000,
    DefaultPanningModel = "equalpower",
}

/**
 *
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
 * @returns `true` if the spatial audio options are defined, otherwise `false`.
 */
export function hasSpatialAudioOptions(options: ISpatialAudioOptions): boolean {
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

/**
 *
 */
export abstract class SpatialAudioSubNode extends AbstractAudioSubNode {
    protected constructor(owner: IAudioParentNode) {
        super(AudioSubNode.Spatial, owner);
    }
}
