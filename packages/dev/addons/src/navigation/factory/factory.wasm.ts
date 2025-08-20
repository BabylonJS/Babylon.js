import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin";
import type { Mesh } from "core/Meshes/mesh";

import type { INavMeshParametersV2 } from "../types";
import { GenerateNavMesh } from "../generator/generator.single-thread";
import { BjsRecast, InitRecast } from "./common";

/**
 * Creates a navigation plugin for the given scene using Recast WASM.
 * @returns A promise that resolves to the created navigation plugin.
 * @remarks This function initializes the Recast WASM module and then calls the NavigationPlugin
 */
export async function CreateNavigationPluginWasmAsync() {
    await InitRecast();

    const navigationPlugin = new RecastNavigationJSPluginV2(BjsRecast);

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
