import type { Quaternion, Vector3 } from "../../../../Maths/math.vector";

/** */
export abstract class AbstractSpatialAudioListener {
    public abstract get position(): Vector3;
    public abstract set position(value: Vector3);

    public abstract get rotation(): Vector3;
    public abstract set rotation(value: Vector3);

    public abstract get rotationQuaternion(): Quaternion;
    public abstract set rotationQuaternion(value: Quaternion);
}
