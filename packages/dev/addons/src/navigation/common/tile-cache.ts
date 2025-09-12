import type { NavMesh, OffMeshConnectionParams, TileCache } from "@recast-navigation/core";

import { BjsRecast } from "../factory/common";

/**
 * Creates a default tile cache mesh process function
 * @param offMeshConnections offMeshConnections
 * @param area the area to be set for each poly
 * @param flags the flags to be set for each poly
 * @returns the tile cache mesh process function
 */
export function CreateDefaultTileCacheMeshProcess(offMeshConnections: OffMeshConnectionParams[] = [], area = 0, flags = 1) {
    return new BjsRecast.TileCacheMeshProcess((navMeshCreateParams, polyAreas, polyFlags) => {
        for (let i = 0; i < navMeshCreateParams.polyCount(); ++i) {
            polyAreas.set(i, area);
            polyFlags.set(i, flags);
        }

        if (offMeshConnections.length > 0) {
            navMeshCreateParams.setOffMeshConnections(offMeshConnections);
        }
    });
}

/**
 * Waits until the tile cache is fully updated
 * @param navMesh The NavMesh
 * @param tileCache THe TileCache
 */
export function WaitForFullTileCacheUpdate(navMesh: NavMesh, tileCache: TileCache) {
    let upToDate = false;
    while (!upToDate) {
        const result = tileCache.update(navMesh);
        upToDate = result.upToDate;
    }
}
