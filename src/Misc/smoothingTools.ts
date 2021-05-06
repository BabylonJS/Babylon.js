import { Epsilon } from "../Maths/math.constants";
import { Quaternion, Vector3 } from "../Maths/math.vector";
import { Scalar } from "../Maths/math.scalar"

export class SmoothingTools {
    private static _TmpVectors: Vector3[] = [new Vector3(), new Vector3()];

    private static _VectorSlerpToRef(vector1: Vector3, vector2: Vector3, slerp: number, result: Vector3) {
        slerp = Scalar.Clamp(slerp, 0, 1);
        const vector1Dir = SmoothingTools._TmpVectors[0];
        const vector2Dir = SmoothingTools._TmpVectors[1];
        let vector1Length;
        let vector2Length;

        vector1Dir.copyFrom(vector1);
        vector1Length = vector1Dir.length();
        vector1Dir.normalizeFromLength(vector1Length);

        vector2Dir.copyFrom(vector2);
        vector2Length = vector2Dir.length();
        vector2Dir.normalizeFromLength(vector2Length);

        const dot = Vector3.Dot(vector1Dir, vector2Dir);

        let scale1;
        let scale2;

        if (dot < 1 - Epsilon) {
            const omega = Math.acos(dot);
            const invSin = 1 / Math.sin(omega);
            scale1 = Math.sin((1 - slerp) * omega) * invSin;
            scale2 = Math.sin(slerp * omega) * invSin;
        } else {
            // Use linear interpolation
            scale1 = 1 - slerp;
            scale2 = slerp;
        }

        vector1Dir.scaleInPlace(scale1);
        vector2Dir.scaleInPlace(scale2);
        result.copyFrom(vector1Dir).addInPlace(vector2Dir);
        result.scaleInPlace(Scalar.Lerp(vector1Length, vector2Length, slerp));
    }

    public static SmoothToRefVec3(source: Vector3, goal: Vector3, deltaTime: number, lerpTime: number, result: Vector3) {
        return SmoothingTools._VectorSlerpToRef(source, goal, lerpTime === 0 ? 1 : deltaTime / lerpTime, result);
    }

    public static SmoothToRefQuaternion(source: Quaternion, goal: Quaternion, deltaTime: number, lerpTime: number, result: Quaternion) {
        let slerp = lerpTime === 0 ? 1 : deltaTime / lerpTime;
        slerp = Scalar.Clamp(slerp, 0, 1);

        return Quaternion.SlerpToRef(source, goal, slerp, result);
    }
}