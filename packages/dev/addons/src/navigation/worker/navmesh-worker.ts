import type { RecastConfig } from "@recast-navigation/core";
import { exportNavMesh, init as initRecast } from "@recast-navigation/core";
import { generateSoloNavMesh, generateTiledNavMesh } from "@recast-navigation/generators";

self.onmessage = async (event: {
    data: {
        positions: Float32Array;
        indices: Uint32Array;
        config: Partial<RecastConfig>;
    };
}) => {
    if (!event.data || !event.data.positions || !event.data.indices || !event.data.config) {
        self.postMessage({ success: false, error: "Invalid input data" });
        return;
    }

    await initRecast();

    const { positions, indices, config } = event.data;

    const result = config && "tileSize" in config ? generateTiledNavMesh(positions, indices, config) : generateSoloNavMesh(positions, indices, config);
    if (!result.success || !result.navMesh) {
        self.postMessage(result);
        return;
    }

    const navMeshExport = exportNavMesh(result.navMesh);
    self.postMessage(navMeshExport, { transfer: [navMeshExport.buffer] });

    result.navMesh?.destroy();
};
