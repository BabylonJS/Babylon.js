import { init as initRecast } from "@recast-navigation/core";
import RecastWasm from "@recast-navigation/wasm";

import type { Scene } from "core/scene";

import { CreateNavigationPluginAsync } from "./factory.single-thread";

/**
 * Creates a navigation plugin for the given scene using Recast WASM.
 * @param scene The scene to create the navigation plugin for.
 * @returns A promise that resolves to the created navigation plugin.
 * @remarks This function initializes the Recast WASM module and then calls the NavigationPlugin
 */
export async function CreateNavigationPluginWasmAsync(scene: Scene) {
    await initRecast(RecastWasm);

    return await CreateNavigationPluginAsync(scene);
}
