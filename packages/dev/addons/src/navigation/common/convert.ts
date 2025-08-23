import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";

import type { ComputePathResult } from "../types";

/**
 *  Converts navigation path points to a Vector3 array.
 *  @param navPath The navigation path containing points and success status.
 *  @returns An array of Vector3 points representing the navigation path.
 */
export function ConvertNavPathPoints(navPath: ComputePathResult): Vector3[] {
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
