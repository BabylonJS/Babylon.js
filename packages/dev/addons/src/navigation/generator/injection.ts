import type { Mesh } from "core/Meshes/mesh";

import type { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin";
import type { INavMeshParametersV2 } from "../types";
import { GenerateNavMesh } from "./generator.single-thread";

/**
 * Injects the navigation mesh generation methods into the navigation plugin.
 * @param navigationPlugin The navigation plugin to inject the methods into.
 */
export function InjectGenerators(navigationPlugin: RecastNavigationJSPluginV2) {
    navigationPlugin.createNavMeshImpl = (meshes: Mesh[], parameters: INavMeshParametersV2) => {
        return GenerateNavMesh(meshes, parameters);
    };

    navigationPlugin.createNavMeshAsyncImpl = async (meshes: Mesh[], parameters: INavMeshParametersV2) => {
        return await new Promise((resolve) => {
            resolve(GenerateNavMesh(meshes, parameters));
        });
    };
}
