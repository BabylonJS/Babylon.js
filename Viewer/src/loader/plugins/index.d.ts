import { ILoaderPlugin } from "./loaderPlugin";
/**
 * Get a loader plugin according to its name.
 * The plugin will be cached and will be reused if called for again.
 *
 * @param name the name of the plugin
 */
export declare function getLoaderPluginByName(name: string): ILoaderPlugin;
