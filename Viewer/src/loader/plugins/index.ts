import { TelemetryLoaderPlugin } from "./telemetryLoaderPlugin";
import { ILoaderPlugin } from "./loaderPlugin";
import { MSFTLodLoaderPlugin } from './msftLodLoaderPlugin';
import { ApplyMaterialConfigPlugin } from './applyMaterialConfig';
import { ExtendedMaterialLoaderPlugin } from './extendedMaterialLoaderPlugin';

const pluginCache: { [key: string]: ILoaderPlugin } = {};

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
                pluginCache[name] = new MSFTLodLoaderPlugin();
                break;
            case 'extendedMaterial':
                pluginCache[name] = new ExtendedMaterialLoaderPlugin();
                break;
        }
    }

    return pluginCache[name];
}