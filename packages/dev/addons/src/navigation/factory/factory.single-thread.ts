import { InjectGenerators } from "../generator/injection";
import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin";
import { GetRecast, InitRecast } from "./common";

/**
 * Creates a navigation plugin for the given scene.
 * @returns A promise that resolves to the created navigation plugin.
 * @remarks This function initializes the Recast module and sets up the navigation plugin.
 */
export async function CreateNavigationPluginAsync() {
    await InitRecast();

    const navigationPlugin = new RecastNavigationJSPluginV2(GetRecast());
    InjectGenerators(navigationPlugin);

    return navigationPlugin;
}
