import { Matrix } from './math.vector';
import { DeepImmutable } from '../types';
import { Plane } from './math.plane';

/**
 * Represents a camera frustum
 */
export class Frustum {
    /**
     * Gets the planes representing the frustum
     * @param transform matrix to be applied to the returned planes
     * @returns a new array of 6 Frustum planes computed by the given transformation matrix.
     */
    public static GetPlanes(transform: DeepImmutable<Matrix>): Plane[] {
        var frustumPlanes = [];
        for (var index = 0; index < 6; index++) {
            frustumPlanes.push(new Plane(0.0, 0.0, 0.0, 0.0));
        }
        Frustum.GetPlanesToRef(transform, frustumPlanes);
        return frustumPlanes;
    }

    /**
     * Gets the near frustum plane transformed by the transform matrix
     * @param transform transformation matrix to be applied to the resulting frustum plane
     * @param frustumPlane the resuling frustum plane
     */
    public static GetNearPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
        const m = transform.m;
        frustumPlane.normal.x = m[3] + m[2];
        frustumPlane.normal.y = m[7] + m[6];
        frustumPlane.normal.z = m[11] + m[10];
        frustumPlane.d = m[15] + m[14];
        frustumPlane.normalize();
    }

    /**
     * Gets the far frustum plane transformed by the transform matrix
     * @param transform transformation matrix to be applied to the resulting frustum plane
     * @param frustumPlane the resuling frustum plane
     */
    public static GetFarPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
        const m = transform.m;
        frustumPlane.normal.x = m[3] - m[2];
        frustumPlane.normal.y = m[7] - m[6];
        frustumPlane.normal.z = m[11] - m[10];
        frustumPlane.d = m[15] - m[14];
        frustumPlane.normalize();
    }

    /**
     * Gets the left frustum plane transformed by the transform matrix
     * @param transform transformation matrix to be applied to the resulting frustum plane
     * @param frustumPlane the resuling frustum plane
     */
    public static GetLeftPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
        const m = transform.m;
        frustumPlane.normal.x = m[3] + m[0];
        frustumPlane.normal.y = m[7] + m[4];
        frustumPlane.normal.z = m[11] + m[8];
        frustumPlane.d = m[15] + m[12];
        frustumPlane.normalize();
    }

    /**
     * Gets the right frustum plane transformed by the transform matrix
     * @param transform transformation matrix to be applied to the resulting frustum plane
     * @param frustumPlane the resuling frustum plane
     */
    public static GetRightPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
        const m = transform.m;
        frustumPlane.normal.x = m[3] - m[0];
        frustumPlane.normal.y = m[7] - m[4];
        frustumPlane.normal.z = m[11] - m[8];
        frustumPlane.d = m[15] - m[12];
        frustumPlane.normalize();
    }

    /**
     * Gets the top frustum plane transformed by the transform matrix
     * @param transform transformation matrix to be applied to the resulting frustum plane
     * @param frustumPlane the resuling frustum plane
     */
    public static GetTopPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
        const m = transform.m;
        frustumPlane.normal.x = m[3] - m[1];
        frustumPlane.normal.y = m[7] - m[5];
        frustumPlane.normal.z = m[11] - m[9];
        frustumPlane.d = m[15] - m[13];
        frustumPlane.normalize();
    }

    /**
     * Gets the bottom frustum plane transformed by the transform matrix
     * @param transform transformation matrix to be applied to the resulting frustum plane
     * @param frustumPlane the resuling frustum plane
     */
    public static GetBottomPlaneToRef(transform: DeepImmutable<Matrix>, frustumPlane: Plane): void {
        const m = transform.m;
        frustumPlane.normal.x = m[3] + m[1];
        frustumPlane.normal.y = m[7] + m[5];
        frustumPlane.normal.z = m[11] + m[9];
        frustumPlane.d = m[15] + m[13];
        frustumPlane.normalize();
    }

    /**
     * Sets the given array "frustumPlanes" with the 6 Frustum planes computed by the given transformation matrix.
     * @param transform transformation matrix to be applied to the resulting frustum planes
     * @param frustumPlanes the resuling frustum planes
     */
    public static GetPlanesToRef(transform: DeepImmutable<Matrix>, frustumPlanes: Plane[]): void {
        // Near
        Frustum.GetNearPlaneToRef(transform, frustumPlanes[0]);

        // Far
        Frustum.GetFarPlaneToRef(transform, frustumPlanes[1]);

        // Left
        Frustum.GetLeftPlaneToRef(transform, frustumPlanes[2]);

        // Right
        Frustum.GetRightPlaneToRef(transform, frustumPlanes[3]);

        // Top
        Frustum.GetTopPlaneToRef(transform, frustumPlanes[4]);

        // Bottom
        Frustum.GetBottomPlaneToRef(transform, frustumPlanes[5]);
    }
}
