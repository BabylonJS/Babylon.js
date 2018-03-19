import { mapperManager } from './mappers';
import { ViewerConfiguration } from './configuration';
import { getConfigurationType } from './types';

import * as deepmerge from '../../assets/deepmerge.min.js';
import { Tools, IFileRequest } from 'babylonjs';

/**
 * The configuration loader will load the configuration object from any source and will use the defined mapper to
 * parse the object and return a conform ViewerConfiguration.
 * It is a private member of the scene.
 */
export class ConfigurationLoader {

    private _configurationCache: { [url: string]: any };

    private _loadRequests: Array<IFileRequest>;

    constructor(private _enableCache: boolean = false) {
        this._configurationCache = {};
        this._loadRequests = [];
    }

    /**
     * load a configuration object that is defined in the initial configuration provided.
     * The viewer configuration can extend different types of configuration objects and have an extra configuration defined.
     * 
     * @param initConfig the initial configuration that has the definitions of further configuration to load.
     * @param callback an optional callback that will be called sync, if noconfiguration needs to be loaded or configuration is payload-only
     * @returns A promise that delivers the extended viewer configuration, when done.
     */
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
                    return this._loadFile(url);
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

    /**
     * Dispose the configuration loader. This will cancel file requests, if active.
     */
    public dispose() {
        this._loadRequests.forEach(request => {
            request.abort();
        });
        this._loadRequests.length = 0;
    }

    private _loadFile(url: string): Promise<any> {
        let cacheReference = this._configurationCache;
        if (this._enableCache && cacheReference[url]) {
            return Promise.resolve(cacheReference[url]);
        }

        return new Promise((resolve, reject) => {
            let fileRequest = Tools.LoadFile(url, (result) => {
                let idx = this._loadRequests.indexOf(fileRequest);
                if (idx !== -1)
                    this._loadRequests.splice(idx, 1);
                if (this._enableCache) cacheReference[url] = result;
                resolve(result);
            }, undefined, undefined, false, (request, error: any) => {
                let idx = this._loadRequests.indexOf(fileRequest);
                if (idx !== -1)
                    this._loadRequests.splice(idx, 1);
                reject(error);
            });
            this._loadRequests.push(fileRequest);
        });
    }

}