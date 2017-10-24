import { mapperManager } from './mappers';
import { ViewerConfiguration, defaultConfiguration } from './configuration';

import * as merge from 'lodash.merge';

export class ConfigurationLoader {

    private configurationCache: { (url: string): any };

    public loadConfiguration(initConfig: ViewerConfiguration = {}): Promise<ViewerConfiguration> {

        let loadedConfig = merge({}, initConfig);

        if (loadedConfig.defaultViewer) {
            loadedConfig = merge(loadedConfig, defaultConfiguration);
        } else {
            loadedConfig = merge(defaultConfiguration, loadedConfig);
        }

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
                return merge(loadedConfig, parsed);
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