import { importNavMesh, NavMeshQuery } from "@recast-navigation/core";

/**
 *  Builds a NavMesh and NavMeshQuery from serialized data.
 *  @param data The serialized NavMesh data.
 *  @returns An object containing the NavMesh and NavMeshQuery.
 *  @remarks This function deserializes the NavMesh data and creates a NavMeshQuery
 *  instance for querying the NavMesh.
 *  @throws Error if the NavMesh data is invalid or cannot be deserialized.
 */
export function buildFromNavmeshData(data: Uint8Array) {
    const result = importNavMesh(data);

    if (!result.navMesh) {
        throw new Error(`Unable to deserialize NavMesh.`);
    }

    return {
        navMesh: result.navMesh,
        navMeshQuery: new NavMeshQuery(result.navMesh),
    };
}

/*
export function CreateNavMesh(
    meshes: Array<Mesh>,
    parameters: INavMeshParametersV2,
    worker?: {
        completion: (navMesh: NavMesh, navMeshQuey: NavMeshQuery) => void;
        worker: Worker;
    }
) {
    // if (this._worker && !completion) {
    //     Logger.Warn("A worker is avaible but no completion callback. Defaulting to blocking navmesh creation");
    // } else if (!this._worker && completion) {
    //     Logger.Warn("A completion callback is avaible but no worker. Defaulting to blocking navmesh creation");
    // }

    if (meshes.length === 0) {
        throw new Error("At least one mesh is needed to create the nav mesh.");
    }

    const [positions, indices] = getPositionsAndIndices(meshes);

    // this._positions = positions;
    // this._indices = indices;

    const config = CreateNavMeshConfig(parameters);

    if (worker) {
        const positions: Float32Array = new Float32Array();
        const indices: Uint32Array = new Uint32Array();

        // spawn worker and send message
        worker.worker.postMessage(
            {
                positions,
                indices,
                config,
            },
            [positions.buffer, indices.buffer]
        );

        worker.worker.onmessage = (e) => {
            if ((e as any).data?.succes === false) {
                throw new Error(`Unable to generateSoloNavMesh:${e}`);
            } else {
                const navMeshAndQuery = buildFromNavmeshData(e.data);
                worker.completion(navMeshAndQuery.navMesh, navMeshAndQuery.navMeshQuery);
            }
        };
    } else {
        // blocking calls
        if (!positions || indices) {
            throw new Error("Unable to get nav mesh. No vertices or indices.");
        }

        // generate solo or tiled navmesh
        const result = "tileSize" in config ? generateTiledNavMesh(positions, indices, config as TiledNavMeshGeneratorConfig) : generateSoloNavMesh(positions, indices, config);

        if (!result.success) {
            throw new Error(`Unable to generateSoloNavMesh:${result.error}`);
        }

        return {
            navMesh: result.navMesh,
            navMeshQuery: new NavMeshQuery(result.navMesh),
        };
    }
}

 */
