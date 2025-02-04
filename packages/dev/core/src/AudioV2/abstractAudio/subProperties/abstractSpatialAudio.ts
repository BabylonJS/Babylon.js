import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import { SpatialAudioAttachmentType } from "../spatial/spatialAudioAttacher";

export const _SpatialAudioDefaults = {
    ATTACHMENT_TYPE: SpatialAudioAttachmentType.POSITION_AND_ROTATION,
    CONE_INNER_ANGLE: 6.28318530718,
    CONE_OUTER_ANGLE: 6.28318530718,
    CONE_OUTER_VOLUME: 0,
    DISTANCE_MODEL: "inverse" as "linear" | "inverse" | "exponential",
    MAX_DISTANCE: 10000,
    MIN_UPDATE_TIME: 0,
    PANNING_MODEL: "equalpower" as "equalpower" | "HRTF",
    POSITION: Vector3.Zero(),
    REFERENCE_DISTANCE: 1,
    ROLLOFF_FACTOR: 1,
    ROTATION: Vector3.Zero(),
    ROTATION_QUATERNION: Quaternion.FromEulerVector(Vector3.Zero()),
};

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioOptions {
    /**
     * The mesh the spatialization will use to update its position and rotation. Defaults to `null`.
     */
    spatialAttachedMesh: AbstractMesh;
    /**
     * The transform node the spatialization will use to update its position and rotation. Defaults to `null`.
     */
    spatialAttachedTransformNode: TransformNode;
    /**
     * The type of attachment to use; position, rotation, or both. Defaults to both.
     */
    spatialAttachmentType: SpatialAudioAttachmentType;
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
     * The algorithm to use to reduce the volume of the spatial audio source as it moves away from the listener. Defaults to "inverse".
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
     * The maximum distance between the spatial source and the listener, after which the volume is not reduced any further. Defaults to 10000.
     * - This value is used only when the {@link spatialDistanceModel} is set to `"linear"`.
     * @see {@link spatialDistanceModel}
     */
    spatialMaxDistance: number;
    /**
     * The minimum update time in seconds of the spatialization if it is attached to a mesh or transform node. Defaults to `0`.
     * - The spatialization's position and rotation will not update faster than this time, but they may update slower depending on the frame rate.
     */
    spatialMinUpdateTime: number;
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
     * The distance for reducing volume as the spatial source moves away from the listener – i.e. the distance the volume reduction starts at. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link spatialDistanceModel}
     */
    spatialReferenceDistance: number;
    /**
     * How quickly the volume is reduced as the spatial source moves away from the listener. Defaults to 1.
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
        options.spatialAttachedMesh !== undefined ||
        options.spatialAttachedTransformNode !== undefined ||
        options.spatialAttachmentType !== undefined ||
        options.spatialConeInnerAngle !== undefined ||
        options.spatialConeOuterAngle !== undefined ||
        options.spatialConeOuterVolume !== undefined ||
        options.spatialDistanceModel !== undefined ||
        options.spatialMaxDistance !== undefined ||
        options.spatialMinUpdateTime !== undefined ||
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
     * The mesh the spatialization will use to update its position and rotation. Defaults to `null`.
     */
    public abstract attachedMesh: Nullable<AbstractMesh>;

    /**
     * The transform node the spatialization will use to update its position and rotation. Defaults to `null`.
     */
    public abstract attachedTransformNode: Nullable<TransformNode>;

    /**
     * The type of attachment to use; position, rotation, or both. Defaults to both.
     */
    public abstract attachmentType: SpatialAudioAttachmentType;

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
     * Whether the audio source is attached to a mesh or transform node.
     */
    public abstract isAttached: boolean;

    /**
     * The maximum distance between the audio source and the listener, after which the volume is not reduced any further. Defaults to 10000.
     * - This value is used only when the {@link distanceModel} is set to `"linear"`.
     * @see {@link distanceModel}
     */
    public abstract maxDistance: number;

    /**
     * The minimum update time in seconds of the spatialization if it is attached to a mesh or transform node. Defaults to `0`.
     * - The spatialization's position and rotation will not update faster than this time, but they may update slower depending on the frame rate.
     */
    public minUpdateTime: number = 0;

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
