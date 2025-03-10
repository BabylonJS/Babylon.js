import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Node } from "../../../node";
import type { SpatialAudioAttachmentType } from "../../spatialAudioAttachmentType";

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
     * The minimum update time in seconds of the listener if it is attached to a mesh, scene or transform node. Defaults to `0`.
     * - The listener's position and rotation will not update faster than this time, but they may update slower depending on the frame rate.
     */
    listenerMinUpdateTime: number;
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
    return (
        options.listenerEnabled ||
        options.listenerMinUpdateTime !== undefined ||
        options.listenerPosition !== undefined ||
        options.listenerRotation !== undefined ||
        options.listenerRotationQuaternion !== undefined
    );
}

/**
 * Abstract class representing the spatial audio `listener` property on an audio engine.
 *
 * @see {@link AudioEngineV2.listener}
 */
export abstract class AbstractSpatialAudioListener {
    /**
     * Whether the listener is attached to a camera, mesh or transform node.
     */
    public abstract isAttached: boolean;

    /**
     * The minimum update time in seconds of the listener if it is attached to a mesh, scene or transform node. Defaults to `0`.
     * - The listener's position and rotation will not update faster than this time, but they may update slower depending on the frame rate.
     */
    public abstract minUpdateTime: number;

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
     * Attaches the audio source to a scene object.
     * @param sceneNode The scene node to attach the audio source to.
     * @param useBoundingBox Whether to use the bounding box of the node for positioning. Defaults to `false`.
     * @param attachmentType Whather to attach to the node's position and/or rotation. Defaults to `PositionAndRotation`.
     */
    public abstract attach(sceneNode: Node, useBoundingBox?: boolean, attachmentType?: SpatialAudioAttachmentType): void;

    /**
     * Detaches the audio source from the currently attached graphics node.
     */
    public abstract detach(): void;

    /**
     * Updates the position and rotation in the audio engine to the current values.
     */
    public abstract update(): void;
}
