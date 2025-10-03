import { InjectGenerators } from "../generator/injection";
import { RecastNavigationJSPluginV2 } from "../plugin/RecastNavigationJSPlugin";
import type { RecastInjection } from "../types";
import { GetRecast, InitRecast } from "./common";

/**
 * Creates a navigation plugin for the given scene.
 * @returns A promise that resolves to the created navigation plugin.
 * @param options Optional configuration. options.version: The version of Recast to use. options.instance: A custom Recast instance to inject instead of loading one.
 * @remarks This function initializes the Recast module and sets up the navigation plugin.
 */
export async function CreateNavigationPluginAsync(options?: { version?: string; instance?: RecastInjection }) {
    await InitRecast(options);

    const navigationPlugin = new RecastNavigationJSPluginV2(GetRecast());
    InjectGenerators(navigationPlugin);

    return navigationPlugin;
}
