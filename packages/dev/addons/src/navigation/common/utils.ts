import type { IVector3Like } from "core/Maths/math.like";
import { Vector3 } from "core/Maths/math.vector";

/**
 * Utility function based on Chaikin's alogrithm for navigation path smoothing and segment generation.
 * @param points Array of points to be smoothed, where each point is an object with x, y, and z properties.
 * @param iterations Number of smoothing iterations to apply. Default 1.
 * @returns A new array of smoothed points after applying the Chaikin's algorithm.
 */
export function GetChaikinSmoothPath(points: IVector3Like[], iterations = 1) {
    for (let i = 0; i < iterations; i++) {
        const smoothed = [];
        for (let j = 0; j < points.length - 1; j++) {
            const p0 = points[j];
            const p1 = points[j + 1];

            smoothed.push({
                x: 0.75 * p0.x + 0.25 * p1.x,
                y: 0.75 * p0.y + 0.25 * p1.y,
                z: 0.75 * p0.z + 0.25 * p1.z,
            });

            smoothed.push({
                x: 0.25 * p0.x + 0.75 * p1.x,
                y: 0.25 * p0.y + 0.75 * p1.y,
                z: 0.25 * p0.z + 0.75 * p1.z,
            });
        }

        if (points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y && points[0].z === points[points.length - 1].z) {
            smoothed.push(smoothed[0]);
        }

        points = smoothed;
    }
    return points;
}

/**
 *  Generates a series of points that create an L-shaped path between each pair of points in the input navigation segment.
 *  The path consists of a horizontal segment followed by a vertical segment, or vice versa,
 *  depending on the relative distances between the x and z coordinates of the points.
 * @param navSegment An array of Vector3 points representing the navigation segment.
 * @returns An array of Vector3 points representing the L-shaped path.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function GetLShapedPath(navSegment: Vector3[]) {
    const points = [];
    for (let j = 0; j < navSegment.length - 1; j++) {
        const p0 = navSegment[j];
        const p1 = navSegment[j + 1];
        const p01 = getLShapedPoint(p0, p1);
        points.push(p0, new Vector3(p01.x, p1.y, p01.z), p1);
    }
    return points;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function getLShapedPoint(pointA: IVector3Like, pointB: IVector3Like) {
    const { x: x1, z: y1 } = pointA;
    const { x: x2, z: y2 } = pointB;

    let pointC;

    // Determine turn direction automatically based on the offset
    if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
        // Horizontal-then-vertical turn
        pointC = { x: x2, z: y1 };
    } else {
        // Vertical-then-horizontal turn
        pointC = { x: x1, z: y2 };
    }

    return pointC;
}
