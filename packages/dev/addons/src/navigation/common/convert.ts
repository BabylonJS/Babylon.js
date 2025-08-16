import type { IVector3Like } from "core/Maths/math.like";
import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";

import type { ComputeSmoothPathResult } from "../types";

/**
 *  Converts navigation path points to a Vector3 array.
 *  @param navPath The navigation path containing points and success status.
 *  @returns An array of Vector3 points representing the navigation path.
 */
export function ConvertNavPathPoints(
    navPath:
        | {
              /**
               * The error object containing details about the failure.
               */
              error?: {
                  /**
                   * A descriptive error message.
                   */
                  name: string;
                  /**
                   * A detailed error message describing the issue.
                   */
                  status?: number;
              };
              /**
               * The array of points in the navigation path, where each point is an object with x, y, and z properties.
               */
              path: IVector3Like[];
              /**
               * Indicates whether the navigation path was successfully computed. If false, the path may not be valid or complete.
               */
              success: boolean;
          }
        | ComputeSmoothPathResult
): Vector3[] {
    // TODO: should we return IVector3Like[] instead of Vector3[]?
    const positions = [];

    if (navPath.success) {
        const pointCount = navPath.path.length;
        for (let pt = 0; pt < pointCount; pt++) {
            const p = navPath.path[pt];
            positions.push(new Vector3(p.x, p.y, p.z));
        }
    } else {
        Logger.Warn("Unable to convert navigation path point, because navPath generation has failed.");
    }

    return positions;
}
