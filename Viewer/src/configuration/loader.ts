import { mapperManager } from './mappers';
import { ViewerConfiguration } from './configuration';
import { getConfigurationType } from './types';

import * as deepmerge from '../../assets/deepmerge.min.js';

export class ConfigurationLoader {

    private configurationCache: { [url: string]: any };

    constructor() {
        this.configurationCache = {};
    }

    public loadConfiguration(initConfig: ViewerConfiguration = {}): Promise<ViewerConfiguration> {

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
                return deepmerge(loadedConfig, parsed);
            });
        } else {
            return Promise.resolve(loadedConfig);
        }
    }

    private loadFile(url: string): Promise<any> {
        let cacheReference = this.configurationCache;
        if (cacheReference[url]) {
            return Promise.resolve(cacheReference[url]);
        }

        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.send();
            xhr.onreadystatechange = function () {
                var DONE = 4;
                var OK = 200;
                if (xhr.readyState === DONE) {
                    if (xhr.status === OK) {
                        cacheReference[url] = xhr.responseText;
                        resolve(xhr.responseText); // 'This is the returned text.'
                    } else {
                        console.log('Error: ' + xhr.status, url);
                        reject('Error: ' + xhr.status); // An error occurred during the request.
                    }
                }
            }
        });
    }


}

export let configurationLoader = new ConfigurationLoader();

export default configurationLoader;