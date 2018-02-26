import { mapperManager } from './mappers';
import { ViewerConfiguration } from './configuration';
import { getConfigurationType } from './types';

import * as deepmerge from '../../assets/deepmerge.min.js';
import { Tools, IFileRequest } from 'babylonjs';

export class ConfigurationLoader {

    private configurationCache: { [url: string]: any };

    private loadRequests: Array<IFileRequest>;

    constructor() {
        this.configurationCache = {};
        this.loadRequests = [];
    }

    public loadConfiguration(initConfig: ViewerConfiguration = {}, callback?: (config: ViewerConfiguration) => void): Promise<ViewerConfiguration> {

        let loadedConfig: ViewerConfiguration = deepmerge({}, initConfig);

        let extendedConfiguration = getConfigurationType(loadedConfig.extends || "");

        loadedConfig = deepmerge(extendedConfiguration, loadedConfig);

        if (loadedConfig.configuration) {

            let mapperType = "json";
            return Promise.resolve().then(() => {
                if (typeof loadedConfig.configuration === "string" || (loadedConfig.configuration && loadedConfig.configuration.url)) {
                    // a file to load

                    let url: string = '';
                    if (typeof loadedConfig.configuration === "string") {
                        url = loadedConfig.configuration;
                    }

                    // if configuration is an object
                    if (typeof loadedConfig.configuration === "object" && loadedConfig.configuration.url) {
                        url = loadedConfig.configuration.url;
                        let type = loadedConfig.configuration.mapper;
                        // empty string?
                        if (!type) {
                            // load mapper type from filename / url
                            type = loadedConfig.configuration.url.split('.').pop();
                        }
                        mapperType = type || mapperType;
                    }
                    return this.loadFile(url);
                } else {
                    if (typeof loadedConfig.configuration === "object") {
                        mapperType = loadedConfig.configuration.mapper || mapperType;
                        return loadedConfig.configuration.payload || {};
                    }
                    return {};

                }
            }).then((data: any) => {
                let mapper = mapperManager.getMapper(mapperType);
                let parsed = mapper.map(data);
                let merged = deepmerge(loadedConfig, parsed);
                if (callback) callback(merged);
                return merged;
            });
        } else {
            if (callback) callback(loadedConfig);
            return Promise.resolve(loadedConfig);
        }
    }

    public dispose() {
        this.loadRequests.forEach(request => {
            request.abort();
        });
    }

    private loadFile(url: string): Promise<any> {
        let cacheReference = this.configurationCache;
        if (cacheReference[url]) {
            return Promise.resolve(cacheReference[url]);
        }

        return new Promise((resolve, reject) => {
            let fileRequest = Tools.LoadFile(url, resolve, undefined, undefined, false, (request, error: any) => {
                reject(error);
            });
            this.loadRequests.push(fileRequest);
        });
    }

}

export let configurationLoader = new ConfigurationLoader();

export default configurationLoader;