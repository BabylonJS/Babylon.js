import { mapperManager } from './mappers';
import { ViewerConfiguration } from './configuration';
import { processConfigurationCompatibility } from './configurationCompatibility';

import { deepmerge } from '../helper';
import { Tools } from 'babylonjs/Misc/tools';
import { extendedConfiguration } from './types/extended';
import { renderOnlyDefaultConfiguration } from './types/renderOnlyDefault';
import { IFileRequest } from 'babylonjs/Misc/fileRequest';

/**
 * The configuration loader will load the configuration object from any source and will use the defined mapper to
 * parse the object and return a conform ViewerConfiguration.
 * It is a private member of the scene.
 */
export class RenderOnlyConfigurationLoader {

    private _configurationCache: { [url: string]: any };

    private _loadRequests: Array<IFileRequest>;

    constructor(private _enableCache: boolean = false) {
        this._configurationCache = {};
        this._loadRequests = [];
    }

    private _getConfigurationTypeExcludeTemplate(types: string): ViewerConfiguration {
        let config: ViewerConfiguration = {};
        let typesSeparated = types.split(",");
        typesSeparated.forEach((type) => {
            switch (type.trim()) {
                case 'default':
                    config = deepmerge(config, renderOnlyDefaultConfiguration);
                    break;
                case 'none':
                    break;
                case 'extended':
                default:
                    config = deepmerge(config, extendedConfiguration);
                    break;
            }
            if (config.extends) {
                config = deepmerge(config, this._getConfigurationTypeExcludeTemplate(config.extends));
            }
        });
        return config;
    };

    protected getExtendedConfig(type: string | undefined) {
        return this._getConfigurationTypeExcludeTemplate(type || "extended");
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
        this._processInitialConfiguration(loadedConfig);

        let extendedConfiguration = this.getExtendedConfig(loadedConfig.extends);

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
                let parsed = deepmerge(mapper.map(data), loadedConfig);
                let merged = deepmerge(extendedConfiguration, parsed);
                processConfigurationCompatibility(merged);
                if (callback) { callback(merged); }
                return merged;
            });
        } else {
            loadedConfig = deepmerge(extendedConfiguration, loadedConfig);
            processConfigurationCompatibility(loadedConfig);
            if (callback) { callback(loadedConfig); }
            return Promise.resolve(loadedConfig);
        }
    }

    /**
     * Dispose the configuration loader. This will cancel file requests, if active.
     */
    public dispose() {
        this._loadRequests.forEach((request) => {
            request.abort();
        });
        this._loadRequests.length = 0;
    }

    /**
     * This function will process the initial configuration and make needed changes for the viewer to work.
     * @param config the mutable(!) initial configuration to process
     */
    private _processInitialConfiguration(config: ViewerConfiguration) {
        if (config.model) {
            if (typeof config.model === "string") {
                config.model = {
                    url: config.model
                };
            }
        }
    }

    private _loadFile(url: string): Promise<any> {
        let cacheReference = this._configurationCache;
        if (this._enableCache && cacheReference[url]) {
            return Promise.resolve(cacheReference[url]);
        }

        return new Promise((resolve, reject) => {
            let fileRequest = Tools.LoadFile(url, (result) => {
                let idx = this._loadRequests.indexOf(fileRequest);
                if (idx !== -1) {
                    this._loadRequests.splice(idx, 1);
                }
                if (this._enableCache) { cacheReference[url] = result; }
                resolve(result);
            }, undefined, undefined, false, (request, error: any) => {
                let idx = this._loadRequests.indexOf(fileRequest);
                if (idx !== -1) {
                    this._loadRequests.splice(idx, 1);
                }
                reject(error);
            });
            this._loadRequests.push(fileRequest);
        });
    }

}