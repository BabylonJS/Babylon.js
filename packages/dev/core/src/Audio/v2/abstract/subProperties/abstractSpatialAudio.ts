import type { Quaternion, Vector3 } from "../../../../Maths/math.vector";

/** */
export abstract class AbstractSpatialAudio {
    /**
     * The spatial cone inner angle, in radians. Defaults to 2π.
     * - When the listener is inside the cone inner angle, the volume is at its maximum.
     */
    public abstract get coneInnerAngle(): number;
    public abstract set coneInnerAngle(value: number);

    /**
     * The spatial cone outer angle, in radians. Defaults to 2π.
     * - When the listener is between the the cone inner and outer angles, the volume fades to its minimum as the listener approaches the outer angle.
     * - When the listener is outside the cone outer angle, the volume is at its minimum.
     */
    public abstract get coneOuterAngle(): number;
    public abstract set coneOuterAngle(value: number);

    /**
     * The amount of volume reduction outside the {@link coneOuterAngle}. Defaults to 0.
     */
    public abstract get coneOuterVolume(): number;
    public abstract set coneOuterVolume(value: number);

    /**
     * The algorithm to use to reduce the volume of the audio source as it moves away from the listener. Defaults to "inverse".
     * @see {@link maxDistance}
     * @see {@link referenceDistance}
     * @see {@link rolloffFactor}
     */
    public abstract get distanceModel(): "linear" | "inverse" | "exponential";
    public abstract set distanceModel(value: "linear" | "inverse" | "exponential");

    /**
     * The maximum distance between the audio source and the listener, after which the volume is not reduced any further. Defaults to 10000.
     * - This value is used only when the {@link distanceModel} is set to `"linear"`.
     * @see {@link distanceModel}
     */
    public abstract get maxDistance(): number;
    public abstract set maxDistance(value: number);

    /**
     * The spatial panning model. Defaults to "equalpower".
     * - "equalpower" requires less CPU than "HRTF" but is less realistic for listeners with headphones or speakers close to the ears.
     * - "HRTF" requires more CPU but is more realistic for listeners with headphones or speakers close to the ears.
     */
    public abstract get panningModel(): "equalpower" | "HRTF";
    public abstract set panningModel(value: "equalpower" | "HRTF");

    /**
     * The spatial position. Defaults to (0, 0, 0).
     */
    public abstract get position(): Vector3;
    public abstract set position(value: Vector3);

    /**
     * The distance for reducing volume as the audio source moves away from the listener – i.e. the distance the volume reduction starts at. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link distanceModel}
     */
    public abstract get referenceDistance(): number;
    public abstract set referenceDistance(value: number);

    /**
     * How quickly the volume is reduced as the source moves away from the listener. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link distanceModel}
     */
    public abstract get rolloffFactor(): number;
    public abstract set rolloffFactor(value: number);

    /**
     * The spatial rotation.
     */
    public abstract get rotation(): Vector3;
    public abstract set rotation(value: Vector3);

    /**
     * The spatial rotation quaternion.
     */
    public abstract get rotationQuaternion(): Quaternion;
    public abstract set rotationQuaternion(value: Quaternion);
}
