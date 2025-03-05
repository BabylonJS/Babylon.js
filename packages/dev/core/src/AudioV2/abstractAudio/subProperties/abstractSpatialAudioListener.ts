import type { Camera } from "../../../Cameras";
import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { SpatialAudioAttachmentType } from "../components/spatialAudioAttacherComponent";

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
     * The camera the listener will use to update its position and rotation. Defaults to `null`.
     */
    listenerAttachedCamera: Camera;
    /**
     * The mesh the listener will use to update its position and rotation. Defaults to `null`.
     */
    listenerAttachedMesh: AbstractMesh;
    /**
     * The transform node the listener will use to update its position and rotation. Defaults to `null`.
     */
    listenerAttachedTransformNode: TransformNode;
    /**
     * The type of attachment to use; position, rotation, or both. Defaults to both.
     */
    listenerAttachmentType: SpatialAudioAttachmentType;
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
        options.listenerAttachedCamera !== undefined ||
        options.listenerAttachedMesh !== undefined ||
        options.listenerAttachedTransformNode !== undefined ||
        options.listenerAttachmentType !== undefined ||
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
     * The camera the listener will use to update its position and rotation. Defaults to `null`.
     */
    public abstract attachedCamera: Nullable<Camera>;

    /**
     * The mesh the listener will use to update its position and rotation. Defaults to `null`.
     */
    public abstract attachedMesh: Nullable<AbstractMesh>;

    /**
     * The transform node the listener will use to update its position and rotation. Defaults to `null`.
     */
    public abstract attachedTransformNode: Nullable<TransformNode>;

    /**
     * The type of attachment to use; position, rotation, or both. Defaults to both.
     */
    public abstract attachmentType: SpatialAudioAttachmentType;

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
     * Updates the position and rotation in the audio engine to the current values.
     */
    public abstract update(): void;
}
