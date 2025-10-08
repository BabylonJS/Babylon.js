/**
 * IMPORTANT!
 * This file is still under construction and will change in the future.
 * Workers are not yet supported.
 * For more info visit: https://forum.babylonjs.com/t/replacing-recastjs-with-recast-navigation-js/56003/46
 */
import type { NavMeshQuery, NavMesh, TileCache } from "@recast-navigation/core";

import type { Mesh } from "core/Meshes/mesh";

import type { INavMeshParametersV2 } from "../types";
import { GetPositionsAndIndices } from "../common/getters";
import { BuildFromNavmeshData, BuildFromTileCacheData } from "./generator.common";
import { CreateDefaultTileCacheMeshProcess } from "../common/tile-cache";

/**
 * Builds a NavMesh and NavMeshQuery from meshes using provided parameters.
 * @param meshes The array of meshes used to create the NavMesh.
 * @param parameters The parameters used to configure the NavMesh generation.
 * @param workerOptions Options for the worker, including a completion callback and the worker instance.
 * @throws Error if the NavMesh data is invalid or cannot be deserialized.
 */
export function GenerateNavMeshWithWorker(
    meshes: Array<Mesh>,
    parameters: INavMeshParametersV2,
    workerOptions: {
        /**
         * Completion callback that is called when the NavMesh generation is complete.
         * @param navMesh The generated NavMesh.
         * @param navMeshQuery The NavMeshQuery associated with the generated NavMesh.
         * @param tileCache Optional TileCache if tile cache generation was used.
         */
        completion: (navMesh: NavMesh, navMeshQuery: NavMeshQuery, tileCache?: TileCache) => void;
        /**
         *  Worker instance used for asynchronous NavMesh generation.
         */
        worker: Worker;
    }
) {
    if (meshes.length === 0) {
        throw new Error("At least one mesh is needed to create the nav mesh.");
    }

    // callback function to process the message from the worker
    workerOptions.worker.onmessage = (e) => {
        if ((e as any).data?.success === false) {
            throw new Error(`Unable to generate navMesh: ${e}`);
        } else {
            const { navMesh, tileCache } = e.data;
            if (tileCache) {
                // if tileCache is present, the binary data contains the navmesh and the tilecache as well
                const tileCacheArray = new Uint8Array(tileCache);
                const navMeshData = BuildFromTileCacheData(tileCacheArray, CreateDefaultTileCacheMeshProcess());
                workerOptions.completion(navMeshData.navMesh, navMeshData.navMeshQuery, navMeshData.tileCache);
                return;
            } else {
                if (navMesh) {
                    // deserialize the navmesh only (no tilecache present)
                    const navMeshArray = new Uint8Array(navMesh);
                    const navMeshData = BuildFromNavmeshData(navMeshArray);
                    workerOptions.completion(navMeshData.navMesh, navMeshData.navMeshQuery, undefined);
                    return;
                }
            }

            throw new Error(`Unable to generate navMesh/tileCache: ${e}`);
        }
    };

    // send message to worker
    const [positions, indices] = GetPositionsAndIndices(meshes, { doNotReverseIndices: parameters.doNotReverseIndices });
    const positionsCopy = new Float32Array(positions);
    const indicesCopy = new Uint32Array(indices);
    workerOptions.worker.postMessage({ positions: positionsCopy, indices: indicesCopy, parameters }, [positionsCopy.buffer, indicesCopy.buffer]);
}
