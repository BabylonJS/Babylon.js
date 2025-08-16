import type { NavMeshQuery, NavMesh, TileCache } from "@recast-navigation/core";

import type { Mesh } from "core/Meshes/mesh";

import type { INavMeshParametersV2 } from "../types";
import { GetPositionsAndIndices } from "../common/getters";
import { BuildFromNavmeshData } from "./generator.common";

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

    const [positions, indices] = GetPositionsAndIndices(meshes);

    const positionsCopy = new Float32Array(positions);
    const indicesCopy = new Uint32Array(indices);

    workerOptions.worker.postMessage({ positions: positionsCopy, indices: indicesCopy, parameters }, [positionsCopy.buffer, indicesCopy.buffer]);
    workerOptions.worker.onmessage = (e) => {
        if ((e as any).data?.success === false) {
            throw new Error(`Unable to navMesh: ${e}`);
        } else {
            const navMeshData = BuildFromNavmeshData(e.data);
            workerOptions.completion(navMeshData.navMesh, navMeshData.navMeshQuery, navMeshData.tileCache ?? undefined);
        }
    };
}
