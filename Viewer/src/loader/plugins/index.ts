import { TelemetryLoaderPlugin } from "./telemetryLoaderPlugin";
import { ILoaderPlugin } from "./loaderPlugin";

const pluginCache: { [key: string]: ILoaderPlugin } = {};

export function getLoaderPluginByName(name: string) {
    switch (name) {
        case 'telemetry':
            pluginCache[name] = new TelemetryLoaderPlugin();
            return pluginCache[name];
    }
}