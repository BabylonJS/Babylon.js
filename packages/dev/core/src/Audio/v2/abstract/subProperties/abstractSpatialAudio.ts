import type { Quaternion, Vector3 } from "../../../../Maths/math.vector";
import type { TransformNode } from "../../../../Meshes/transformNode";
import type { Nullable } from "../../../../types";

/** */
export abstract class AbstractSpatialAudio {
    public abstract get coneInnerAngle(): number;
    public abstract set coneInnerAngle(value: number);

    public abstract get coneOuterAngle(): number;
    public abstract set coneOuterAngle(value: number);

    public abstract get coneOuterVolume(): number;
    public abstract set coneOuterVolume(value: number);

    public abstract get distanceModel(): "linear" | "inverse" | "exponential";
    public abstract set distanceModel(value: "linear" | "inverse" | "exponential");

    public abstract get maxDistance(): number;
    public abstract set maxDistance(value: number);

    public abstract get panningModel(): "equalpower" | "HRTF";
    public abstract set panningModel(value: "equalpower" | "HRTF");

    public abstract get position(): Vector3;
    public abstract set position(value: Vector3);

    public abstract get referenceDistance(): number;
    public abstract set referenceDistance(value: number);

    public abstract get rolloffFactor(): number;
    public abstract set rolloffFactor(value: number);

    public abstract get rotation(): Vector3;
    public abstract set rotation(value: Vector3);

    public abstract get rotationQuaternion(): Quaternion;
    public abstract set rotationQuaternion(value: Quaternion);

    public abstract get transformNode(): Nullable<TransformNode>;
    public abstract set transformNode(value: Nullable<TransformNode>);
}
