import type { TileCacheMeshProcess } from "@recast-navigation/core";

import { GetRecast } from "../factory/common";

/**
 *  Builds a NavMesh and NavMeshQuery from serialized data.
 *  @param data The serialized NavMesh data.
 *  @returns An object containing the NavMesh and NavMeshQuery.
 *  @remarks This function deserializes the NavMesh data and creates a NavMeshQuery
 *  instance for querying the NavMesh.
 *  @throws Error if the NavMesh data is invalid or cannot be deserialized.
 */
export function BuildFromNavmeshData(data: Uint8Array) {
    const recast = GetRecast();
    const result = recast.importNavMesh(data);

    if (!result.navMesh) {
        throw new Error(`Unable to deserialize NavMesh.`);
    }

    return {
        navMesh: result.navMesh,
        navMeshQuery: new recast.NavMeshQuery(result.navMesh),
        tileCache: undefined,
    };
}

/**
 * Builds a TileCache and NavMeshQuery from serialized data.
 * @param data The serialized TileCache data.
 * @param tileCacheMeshProcess Optional function to process the TileCache mesh.
 * @returns An object containing the TileCache, NavMesh, and NavMeshQuery.
 */
export function BuildFromTileCacheData(data: Uint8Array, tileCacheMeshProcess: TileCacheMeshProcess) {
    const recast = GetRecast();
    const result = recast.importTileCache(data, tileCacheMeshProcess);

    if (!result.tileCache) {
        throw new Error(`Unable to deserialize TileCache.`);
    }

    return {
        navMesh: result.navMesh,
        navMeshQuery: new recast.NavMeshQuery(result.navMesh),
        tileCache: result.tileCache,
    };
}
