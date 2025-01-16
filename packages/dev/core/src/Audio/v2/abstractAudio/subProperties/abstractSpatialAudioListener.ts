import { Quaternion, Vector3 } from "../../../../Maths/math.vector";

/** @internal */
export class _SpatialAudioListenerDefaults {
    /** @internal */
    public static readonly Position = Vector3.Zero();
    /** @internal */
    public static readonly Rotation = Vector3.Zero();
    /** @internal */
    public static readonly RotationQuaternion = Quaternion.FromEulerVector(_SpatialAudioListenerDefaults.Rotation);
}

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioListenerOptions {
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

/** */
export abstract class AbstractSpatialAudioListener {
    public abstract get position(): Vector3;
    public abstract set position(value: Vector3);

    public abstract get rotation(): Vector3;
    public abstract set rotation(value: Vector3);

    public abstract get rotationQuaternion(): Quaternion;
    public abstract set rotationQuaternion(value: Quaternion);
}
