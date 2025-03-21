import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Node } from "../../../node";
import type { Nullable } from "../../../types";
import type { SpatialAudioAttachmentType } from "../../spatialAudioAttachmentType";

export const _SpatialAudioDefaults = {
    coneInnerAngle: 6.28318530718 as number,
    coneOuterAngle: 6.28318530718 as number,
    coneOuterVolume: 0 as number,
    distanceModel: "linear" as DistanceModelType,
    maxDistance: 10000 as number,
    minDistance: 1 as number,
    panningModel: "equalpower" as PanningModelType,
    position: Vector3.Zero(),
    rolloffFactor: 1 as number,
    rotation: Vector3.Zero(),
    rotationQuaternion: new Quaternion(),
} as const;

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioOptions {
    /**
     * Whether to automatically update the spatial properties of the audio node. Defaults to `true`.
     */
    spatialAutoUpdate: boolean;
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
     *
     * Possible values are:
     * - `"linear"`: The volume is reduced linearly as the source moves away from the listener.
     * - `"inverse"`: The volume is reduced inversely as the source moves away from the listener.
     * - `"exponential"`: The volume is reduced exponentially as the source moves away from the listener.
     *
     * @see {@link spatialMaxDistance}
     * @see {@link spatialMinDistance}
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
     * The minimum update time in seconds of the spatialization if it is attached to a mesh or transform node. Defaults to `0`.
     * - The spatialization's position and rotation will not update faster than this time, but they may update slower depending on the frame rate.
     */
    spatialMinUpdateTime: number;
    /**
     * Possible values are:
     * - `"equalpower"`: Represents the equal-power panning algorithm, generally regarded as simple and efficient.
     * - `"HRTF"`: Renders a stereo output of higher quality than `"equalpower"` — it uses a convolution with measured impulse responses from human subjects.
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
    spatialMinDistance: number;
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
        options.spatialAutoUpdate !== undefined ||
        options.spatialConeInnerAngle !== undefined ||
        options.spatialConeOuterAngle !== undefined ||
        options.spatialConeOuterVolume !== undefined ||
        options.spatialDistanceModel !== undefined ||
        options.spatialMaxDistance !== undefined ||
        options.spatialMinDistance !== undefined ||
        options.spatialMinUpdateTime !== undefined ||
        options.spatialPanningModel !== undefined ||
        options.spatialPosition !== undefined ||
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
     *
     * Possible values are:
     * - `"linear"`: The volume is reduced linearly as the source moves away from the listener.
     * - `"inverse"`: The volume is reduced inversely as the source moves away from the listener.
     * - `"exponential"`: The volume is reduced exponentially as the source moves away from the listener.
     *
     * @see {@link spatialMaxDistance}
     * @see {@link spatialMinDistance}
     * @see {@link spatialRolloffFactor}
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
     * The distance for reducing volume as the audio source moves away from the listener – i.e. the distance the volume reduction starts at. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link distanceModel}
     */
    public abstract minDistance: number;

    /**
     * The minimum update time in seconds of the spatialization if it is attached to a mesh or transform node. Defaults to `0`.
     * - The spatialization's position and rotation will not update faster than this time, but they may update slower depending on the frame rate.
     */
    public abstract minUpdateTime: number;

    /**
     * The spatial panning model. Defaults to "equalpower".
     *
     * Possible values are:
     * - `"equalpower"`: Represents the equal-power panning algorithm, generally regarded as simple and efficient.
     * - `"HRTF"`:Renders a stereo output of higher quality than `"equalpower"` — it uses a convolution with measured impulse responses from human subjects.
     */
    public abstract panningModel: "equalpower" | "HRTF";

    /**
     * The spatial position. Defaults to (0, 0, 0).
     */
    public abstract position: Vector3;

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

    /**
     * Attaches to a scene node.
     *
     * Detaches automatically before attaching to the given scene node.
     * If `sceneNode` is `null` it is the same as calling `detach()`.
     *
     * @param sceneNode The scene node to attach to, or `null` to detach.
     * @param useBoundingBox Whether to use the bounding box of the node for positioning. Defaults to `false`.
     * @param attachmentType Whether to attach to the node's position and/or rotation. Defaults to `PositionAndRotation`.
     */
    public abstract attach(sceneNode: Nullable<Node>, useBoundingBox?: boolean, attachmentType?: SpatialAudioAttachmentType): void;

    /**
     * Detaches from the scene node if attached.
     */
    public abstract detach(): void;

    /**
     * Updates the position and rotation of the associated audio engine object in the audio rendering graph.
     *
     * This is called automatically by default and only needs to be called manually if automatic updates are disabled.
     */
    public abstract update(): void;
}
