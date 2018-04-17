import { TelemetryLoaderPlugin } from "./telemetryLoaderPlugin";
import { ILoaderPlugin } from "./loaderPlugin";
import { MSFTLodLoaderPlugin } from './msftLodLoaderPlugin';
import { MinecraftLoaderPlugin } from './minecraftLoaderPlugin';
import { ExtendedMaterialLoaderPlugin } from './extendedMaterialLoaderPlugin';

const pluginCache: { [key: string]: ILoaderPlugin } = {};

export function getLoaderPluginByName(name: string) {
    switch (name) {
        case 'telemetry':
            pluginCache[name] = new TelemetryLoaderPlugin();
            break;
        case 'msftLod':
            pluginCache[name] = new MSFTLodLoaderPlugin();
            break;
        case 'minecraft':
            pluginCache[name] = new MSFTLodLoaderPlugin();
            break;
        case 'extendedMaterial':
            pluginCache[name] = new ExtendedMaterialLoaderPlugin();
            break;
    }

    return pluginCache[name];
}