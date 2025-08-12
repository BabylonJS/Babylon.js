import type { NavMesh, NavMeshQuery } from "@recast-navigation/core";
import { init as initRecast } from "@recast-navigation/core";

import type { Scene } from "core/scene";
import type { Mesh } from "core/Meshes/mesh";
import { Logger } from "core/Misc";

import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin";
import type { INavMeshParametersV2 } from "../types";
import { GenerateNavMeshWithWorker } from "../generator/generator.worker";
import { NavigationPluginCreateAsync } from "./factory.single-thread";

/**
 * Creates a navigation plugin for the given scene using a worker.
 * @param scene The scene to create the navigation plugin for.
 * @returns A promise that resolves to the created navigation plugin.
 * @remarks This function initializes the Recast module and sets up the navigation plugin to use a worker.
 * The worker is used to handle the creation of the navigation mesh asynchronously.
 * The `createNavMesh` method is not supported in worker mode, use `createNavMeshAsync` instead.
 */
export async function NavigationPluginWorkerCreateAsync(scene: Scene) {
    if (window && !window.Worker) {
        Logger.Error("Web Workers are not supported in this environment. Please ensure your environment supports Web Workers.");
        return await NavigationPluginCreateAsync(scene); // Fallback to single-threaded version
    }

    await initRecast();

    const plugin = new RecastNavigationJSPluginV2(scene);

    const worker = new Worker(new URL("../worker/navmesh-worker", import.meta.url), {
        type: "module",
    });

    plugin.createNavMesh = () => {
        Logger.Warn("createNavMesh is not supported in worker mode, use createNavMeshAsync instead.");
        return null;
    };

    plugin.createNavMeshAsync = async (meshes: Mesh[], parameters: INavMeshParametersV2) => {
        return await new Promise<{
            navMesh: NavMesh;
            navMeshQuery: NavMeshQuery;
        }>((resolve, _reject) => {
            GenerateNavMeshWithWorker(meshes, parameters, {
                worker,
                completion: (navMesh: NavMesh, navMeshQuery: NavMeshQuery) => {
                    resolve({ navMesh, navMeshQuery });
                },
            });
        });
    };

    return plugin;
}
