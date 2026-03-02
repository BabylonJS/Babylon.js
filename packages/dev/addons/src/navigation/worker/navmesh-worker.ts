/**
 * IMPORTANT!
 * This file is still under construction and will change in the future.
 * Workers are not yet supported.
 * For more info visit: https://forum.babylonjs.com/t/replacing-recastjs-with-recast-navigation-js/56003/46
 */
import { exportNavMesh, exportTileCache, init as initRecast } from "@recast-navigation/core";
import type { SoloNavMeshGeneratorConfig, TileCacheGeneratorConfig, TiledNavMeshGeneratorConfig } from "@recast-navigation/generators";
import { generateSoloNavMesh, generateTileCache, generateTiledNavMesh } from "@recast-navigation/generators";

import { CreateSoloNavMeshConfig, CreateTileCacheNavMeshConfig } from "../common/config";
import type { INavMeshParametersV2 } from "../types";

/**
 * Generates a navigation mesh in a web worker.
 */
export function GenerateNavMeshWorker() {
    self.onmessage = async (event: {
        /**
         * The data sent to the worker.
         */
        data: {
            /**
             *  The positions of the vertices in the nav mesh.
             */
            positions: Float32Array;
            /**
             *  The indices of the vertices in the nav mesh.
             */
            indices: Uint32Array;
            /**
             *  The parameters used to configure the nav mesh generation.
             */
            parameters: INavMeshParametersV2;
        };
    }) => {
        if (!event.data || !event.data.positions || !event.data.indices || !event.data.parameters) {
            self.postMessage({ success: false, error: "Invalid input data." });
            return;
        }

        await initRecast();

        const { positions, indices, parameters } = event.data;

        // Decide on the type of nav mesh to generate based on parameters
        // If tileSize is set, we will generate a tiled nav mesh
        // If maxObstacles is set, we will generate a tile cache nav mesh
        // Otherwise, we will generate a solo nav mesh
        const needsTileCache = (parameters.maxObstacles ?? 0) > 0;
        const needsTiledNavMesh = "tileSize" in parameters && (parameters.tileSize ?? 0) > 0;
        const config = needsTileCache ? CreateTileCacheNavMeshConfig(parameters) : needsTileCache ? CreateTileCacheNavMeshConfig(parameters) : CreateSoloNavMeshConfig(parameters);

        const result = needsTiledNavMesh
            ? needsTileCache
                ? generateTileCache(positions, indices, config as TileCacheGeneratorConfig)
                : generateTiledNavMesh(positions, indices, config as TiledNavMeshGeneratorConfig)
            : generateSoloNavMesh(positions, indices, config as SoloNavMeshGeneratorConfig);

        if (!result.success || !result.navMesh) {
            self.postMessage(result);
            return;
        }

        // prepare the transferables
        const transferables: Transferable[] = [];
        const message: {
            navMesh?: Uint8Array<ArrayBufferLike>;
            tileCache?: Uint8Array<ArrayBufferLike>;
        } = { navMesh: undefined, tileCache: undefined };

        // If tile cache is present, serialize it and add to the message
        if ("tileCache" in result && result.tileCache) {
            if (result.tileCache) {
                const tileCacheExport = exportTileCache(result.navMesh, result.tileCache);
                message.tileCache = tileCacheExport;
                transferables.push(tileCacheExport.buffer);
            }
        } else {
            // otherwise send the NavMesh
            const navMeshExport = exportNavMesh(result.navMesh);
            message.navMesh = navMeshExport;
            transferables.push(navMeshExport.buffer);
        }

        // send transferable message
        self.postMessage(message, { transfer: transferables });

        // clean up
        result.navMesh?.destroy();

        if ("tileCache" in result && result.tileCache) {
            result.tileCache.destroy();
        }
    };
}
