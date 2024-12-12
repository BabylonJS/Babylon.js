import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { AbstractAudioComponentOwner } from "../abstractAudioComponentOwner";
import { AbstractAudioComponent } from "./abstractAudioComponent";

/**
 *
 */
export interface ISpatialAudioOptions {
    /**
     * The spatial cone inner angle.
     */
    spatialConeInnerAngle?: number;
    /**
     * The spatial cone outer angle.
     */
    spatialConeOuterAngle?: number;
    /**
     * The spatial cone outer gain.
     */
    spatialConeOuterGain?: number;
    /**
     * The spatial distance model.
     */
    spatialDistanceModel?: "linear" | "inverse" | "exponential";
    /**
     * The spatial max distance.
     */
    spatialMaxDistance?: number;
    /**
     * The spatial panning model.
     */
    spatialPanningModel?: "equalpower" | "HRTF";
    /**
     * The spatial position.
     */
    spatialPosition?: Vector3;
    /**
     * The spatial ref distance.
     */
    spatialRefDistance?: number;
    /**
     * The spatial rolloff factor.
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
export abstract class SpatialAudioComponent extends AbstractAudioComponent {
    protected constructor(owner: AbstractAudioComponentOwner) {
        super(owner);
    }

    public _getComponentTypeName(): string {
        return "Spatial";
    }
}
