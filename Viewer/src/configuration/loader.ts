import { mapperManager } from './mappers';
import { ViewerConfiguration } from './configuration';
import { getConfigurationType } from './types';

import deepmerge from 'deepmerge';

export class ConfigurationLoader {

    private configurationCache: { (url: string): any };

    public loadConfiguration(initConfig: ViewerConfiguration = {}): Promise<ViewerConfiguration> {

        let loadedConfig = deepmerge({}, initConfig);

        let extendedConfiguration = getConfigurationType(loadedConfig && loadedConfig.extends);

        loadedConfig = deepmerge(extendedConfiguration, loadedConfig);

        if (loadedConfig.configuration) {

            let mapperType = "json";
            let url = loadedConfig.configuration;

            // if configuration is an object
            if (loadedConfig.configuration.url) {
                url = loadedConfig.configuration.url;
                mapperType = loadedConfig.configuration.mapper;
                if (!mapperType) {
                    // load mapper type from filename / url
                    mapperType = loadedConfig.configuration.url.split('.').pop();
                }
            }

            let mapper = mapperManager.getMapper(mapperType);
            return this.loadFile(url).then((data: any) => {
                let parsed = mapper.map(data);
                return deepmerge(loadedConfig, parsed);
            });
        } else {
            return Promise.resolve(loadedConfig);
        }
    }

    public getConfigurationType(type: string) {

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
                    }
                } else {
                    console.log('Error: ' + xhr.status, url);
                    reject('Error: ' + xhr.status); // An error occurred during the request.
                }
            }
        });
    }


}

export let configurationLoader = new ConfigurationLoader();

export default configurationLoader;