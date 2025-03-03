import { Quaternion, Vector3 } from "../../../Maths/math.vector";

export const _SpatialAudioDefaults = {
    coneInnerAngle: 6.28318530718,
    coneOuterAngle: 6.28318530718,
    coneOuterVolume: 0,
    distanceModel: "inverse" as DistanceModelType,
    maxDistance: 10000,
    panningModel: "equalpower" as PanningModelType,
    position: Vector3.Zero(),
    referenceDistance: 1,
    rolloffFactor: 1,
    rotation: Vector3.Zero(),
    rotationQuaternion: new Quaternion(),
};

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioOptions {
    /**
     * The spatial cone inner angle, in radians. Defaults to 2π.
     * - When the listener is inside the cone inner angle, the volume is at its maximum.
     */
    spatialConeInnerAngle: number;
    /**
     * The spatial cone outer angle, in radians. Defaults to 2π.
     * - When the listener is between the the cone inner and outer angles, the volume fades to its minimum as the listener approaches the outer angle.
     * - When the listener is outside the cone outer angle, the volume is at its minimum.
     */
    spatialConeOuterAngle: number;
    /**
     * The amount of volume reduction outside the {@link spatialConeOuterAngle}. Defaults to 0.
     */
    spatialConeOuterVolume: number;
    /**
     * The algorithm to use to reduce the volume of the audio source as it moves away from the listener. Defaults to "inverse".
     * @see {@link spatialMaxDistance}
     * @see {@link spatialReferenceDistance}
     * @see {@link spatialRolloffFactor}
     */
    spatialDistanceModel: "linear" | "inverse" | "exponential";
    /**
     * Enable spatial audio. Defaults to false.
     *
     * When set to `true`, the audio node's spatial properties will be initialized on creation and there will be no
     * delay when setting the first spatial value.
     *
     * When not specified, or set to `false`, the audio node's spatial properties will not be initialized on creation
     * and there will be a small delay when setting the first spatial value.
     *
     * - This option is ignored if any other spatial options are set.
     */
    spatialEnabled: boolean;
    /**
     * The maximum distance between the audio source and the listener, after which the volume is not reduced any further. Defaults to 10000.
     * - This value is used only when the {@link spatialDistanceModel} is set to `"linear"`.
     * @see {@link spatialDistanceModel}
     */
    spatialMaxDistance: number;
    /**
     * The spatial panning model. Defaults to "equalpower".
     * - "equalpower" requires less CPU than "HRTF" but is less realistic for listeners with headphones or speakers close to the ears.
     * - "HRTF" requires more CPU but is more realistic for listeners with headphones or speakers close to the ears.
     */
    spatialPanningModel: "equalpower" | "HRTF";
    /**
     * The spatial position. Defaults to (0, 0, 0).
     */
    spatialPosition: Vector3;
    /**
     * The distance for reducing volume as the audio source moves away from the listener – i.e. the distance the volume reduction starts at. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link spatialDistanceModel}
     */
    spatialReferenceDistance: number;
    /**
     * How quickly the volume is reduced as the source moves away from the listener. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link spatialDistanceModel}
     */
    spatialRolloffFactor: number;
    /**
     * The spatial rotation, as Euler angles. Defaults to (0, 0, 0).
     */
    spatialRotation: Vector3;
    /**
     * The spatial rotation, as a quaternion. Defaults to (0, 0, 0, 1).
     */
    spatialRotationQuaternion: Quaternion;
}

/**
 * @param options The spatial audio options to check.
 * @returns `true` if spatial audio options are defined, otherwise `false`.
 */
export function _HasSpatialAudioOptions(options: Partial<ISpatialAudioOptions>): boolean {
    return (
        options.spatialEnabled ||
        options.spatialConeInnerAngle !== undefined ||
        options.spatialConeOuterAngle !== undefined ||
        options.spatialConeOuterVolume !== undefined ||
        options.spatialDistanceModel !== undefined ||
        options.spatialMaxDistance !== undefined ||
        options.spatialPanningModel !== undefined ||
        options.spatialPosition !== undefined ||
        options.spatialReferenceDistance !== undefined ||
        options.spatialRolloffFactor !== undefined ||
        options.spatialRotation !== undefined ||
        options.spatialRotationQuaternion !== undefined
    );
}

/**
 * Abstract class representing the `spatial` audio property on a sound or audio bus.
 *
 * @see {@link AudioEngineV2.listener}
 */
export abstract class AbstractSpatialAudio {
    /**
     * The spatial cone inner angle, in radians. Defaults to 2π.
     * - When the listener is inside the cone inner angle, the volume is at its maximum.
     */
    public abstract coneInnerAngle: number;

    /**
     * The spatial cone outer angle, in radians. Defaults to 2π.
     * - When the listener is between the the cone inner and outer angles, the volume fades to its minimum as the listener approaches the outer angle.
     * - When the listener is outside the cone outer angle, the volume is at its minimum.
     */
    public abstract coneOuterAngle: number;

    /**
     * The amount of volume reduction outside the {@link coneOuterAngle}. Defaults to 0.
     */
    public abstract coneOuterVolume: number;

    /**
     * The algorithm to use to reduce the volume of the audio source as it moves away from the listener. Defaults to "inverse".
     * @see {@link maxDistance}
     * @see {@link referenceDistance}
     * @see {@link rolloffFactor}
     */
    public abstract distanceModel: "linear" | "inverse" | "exponential";

    /**
     * The maximum distance between the audio source and the listener, after which the volume is not reduced any further. Defaults to 10000.
     * - This value is used only when the {@link distanceModel} is set to `"linear"`.
     * @see {@link distanceModel}
     */
    public abstract maxDistance: number;

    /**
     * The spatial panning model. Defaults to "equalpower".
     * - "equalpower" requires less CPU than "HRTF" but is less realistic for listeners with headphones or speakers close to the ears.
     * - "HRTF" requires more CPU but is more realistic for listeners with headphones or speakers close to the ears.
     */
    public abstract panningModel: "equalpower" | "HRTF";

    /**
     * The spatial position. Defaults to (0, 0, 0).
     */
    public abstract position: Vector3;

    /**
     * The distance for reducing volume as the audio source moves away from the listener – i.e. the distance the volume reduction starts at. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link distanceModel}
     */
    public abstract referenceDistance: number;

    /**
     * How quickly the volume is reduced as the source moves away from the listener. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link distanceModel}
     */
    public abstract rolloffFactor: number;

    /**
     * The spatial rotation. Defaults to (0, 0, 0).
     */
    public abstract rotation: Vector3;

    /**
     * The spatial rotation quaternion. Defaults to (0, 0, 0, 1).
     */
    public abstract rotationQuaternion: Quaternion;
}
