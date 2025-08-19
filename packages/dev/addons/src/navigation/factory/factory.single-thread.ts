import { init as initRecast } from "@recast-navigation/core";

import type { Mesh } from "core/Meshes/mesh";

import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin";
import type { INavMeshParametersV2 } from "../types";
import { GenerateNavMesh } from "../generator/generator.single-thread";

/**
 * Creates a navigation plugin for the given scene.
 * @returns A promise that resolves to the created navigation plugin.
 * @remarks This function initializes the Recast module and sets up the navigation plugin.
 */
export async function CreateNavigationPluginAsync() {
    await initRecast();

    const navigationPlugin = new RecastNavigationJSPluginV2();

    navigationPlugin.createNavMeshImpl = (meshes: Mesh[], parameters: INavMeshParametersV2) => {
        return GenerateNavMesh(meshes, parameters);
    };

    navigationPlugin.createNavMeshAsyncImpl = async (meshes: Mesh[], parameters: INavMeshParametersV2) => {
        return await new Promise((resolve) => {
            resolve(GenerateNavMesh(meshes, parameters));
        });
    };

    return navigationPlugin;
}
