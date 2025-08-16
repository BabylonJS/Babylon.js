import { TileCacheMeshProcess } from "@recast-navigation/core";

export const DefaultTileCacheMeshProcess = new TileCacheMeshProcess((navMeshCreateParams, polyAreas, polyFlags) => {
    for (let i = 0; i < navMeshCreateParams.polyCount(); ++i) {
        polyAreas.set(i, 0);
        polyFlags.set(i, 1);
    }
});
