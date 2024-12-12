import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { AbstractAudioSuperNode } from "../abstractAudioComponentOwner";
import { AbstractAudioSubNode } from "./abstractAudioComponent";

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
 *
 */
export abstract class SpatialAudioSubNode extends AbstractAudioSubNode {
    protected constructor(owner: AbstractAudioSuperNode) {
        super("Spatial", owner);
    }
}
