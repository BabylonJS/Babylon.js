import { TileCacheMeshProcess } from "@recast-navigation/core";

/**
 * Creates a default tile cache mesh process function
 * @param area the area to be set for each poly
 * @param flags the flags to be set for each poly
 * @returns the tile cache mesh process function
 */
export function CreateDefaultTileCacheMeshProcess(area = 0, flags = 1) {
    return new TileCacheMeshProcess((navMeshCreateParams, polyAreas, polyFlags) => {
        for (let i = 0; i < navMeshCreateParams.polyCount(); ++i) {
            polyAreas.set(i, area);
            polyFlags.set(i, flags);
        }
    });
}
