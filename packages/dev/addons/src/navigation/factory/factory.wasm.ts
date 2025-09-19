import { InjectGenerators } from "../generator/injection";
import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin";
import { GetRecast, InitRecast } from "./common";

/**
 * Creates a navigation plugin for the given scene using Recast WASM.
 * @returns A promise that resolves to the created navigation plugin.
 * @remarks This function initializes the Recast WASM module and then calls the NavigationPlugin
 */
export async function CreateNavigationPluginWasmAsync() {
    await InitRecast();

    const navigationPlugin = new RecastNavigationJSPluginV2(GetRecast());
    InjectGenerators(navigationPlugin);

    return navigationPlugin;
}
