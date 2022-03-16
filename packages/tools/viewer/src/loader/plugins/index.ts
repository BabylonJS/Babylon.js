import { TelemetryLoaderPlugin } from "./telemetryLoaderPlugin";
import { ILoaderPlugin } from "./loaderPlugin";
import { MSFTLodLoaderPlugin } from './msftLodLoaderPlugin';
import { ApplyMaterialConfigPlugin } from './applyMaterialConfig';
import { ExtendedMaterialLoaderPlugin } from './extendedMaterialLoaderPlugin';
import { Tools } from "babylonjs/Misc/tools";

const pluginCache: { [key: string]: ILoaderPlugin } = {};

export { TelemetryLoaderPlugin, ILoaderPlugin, MSFTLodLoaderPlugin, ApplyMaterialConfigPlugin, ExtendedMaterialLoaderPlugin };

/**
 * Get a loader plugin according to its name.
 * The plugin will be cached and will be reused if called for again.
 *
 * @param name the name of the plugin
 */
export function getLoaderPluginByName(name: string) {
    if (!pluginCache[name]) {
        switch (name) {
            case 'telemetry':
                pluginCache[name] = new TelemetryLoaderPlugin();
                break;
            case 'msftLod':
                pluginCache[name] = new MSFTLodLoaderPlugin();
                break;
            case 'applyMaterialConfig':
                pluginCache[name] = new ApplyMaterialConfigPlugin();
                break;
            case 'extendedMaterial':
                pluginCache[name] = new ExtendedMaterialLoaderPlugin();
                break;
        }
    }

    return pluginCache[name];
}

/**
 *
 */
export function addLoaderPlugin(name: string, plugin: ILoaderPlugin) {
    if (pluginCache[name]) {
        Tools.Warn("Overwriting plugin with the same name - " + name);
    }
    pluginCache[name] = plugin;
}