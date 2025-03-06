import { Quaternion, Vector3 } from "../../../Maths/math.vector";

export const _SpatialAudioListenerDefaults = {
    position: Vector3.Zero(),
    rotation: Vector3.Zero(),
    rotationQuaternion: new Quaternion(),
} as const;

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioListenerOptions {
    /**
     * Whether to automatically update the position and rotation of the listener. Defaults to `true`.
     */
    listenerAutoUpdate: boolean;
    /**
     * Set to `true` to enable the listener. Defaults to `false`.
     */
    listenerEnabled: boolean;
    /**
     * The listener position. Defaults to (0, 0, 0).
     */
    listenerPosition: Vector3;
    /**
     * The listener rotation, as Euler angles. Defaults to (0, 0, 0).
     */
    listenerRotation: Vector3;
    /**
     * The listener rotation, as a quaternion. Defaults to (0, 0, 0, 1).
     */
    listenerRotationQuaternion: Quaternion;
}

/**
 * @param options The spatial audio listener options to check.
 * @returns `true` if spatial audio listener options are defined, otherwise `false`.
 */
export function _HasSpatialAudioListenerOptions(options: Partial<ISpatialAudioListenerOptions>): boolean {
    return options.listenerPosition !== undefined || options.listenerRotation !== undefined || options.listenerRotationQuaternion !== undefined;
}

/**
 * Abstract class representing the spatial audio `listener` property on an audio engine.
 *
 * @see {@link AudioEngineV2.listener}
 */
export abstract class AbstractSpatialAudioListener {
    /**
     * The listener position. Defaults to (0, 0, 0).
     */
    public abstract position: Vector3;

    /**
     * The listener rotation, as Euler angles. Defaults to (0, 0, 0).
     */
    public abstract rotation: Vector3;

    /**
     * The listener rotation, as a quaternion. Defaults to (0, 0, 0, 1).
     */
    public abstract rotationQuaternion: Quaternion;

    /**
     * Updates the position and rotation properties.
     */
    public abstract update(): void;
}
