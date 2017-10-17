import { Tools } from 'babylonjs';
import { ViewerConfiguration } from './configuration';

import { kebabToCamel } from '../helper';

export interface IMapper {
    map(rawSource: any): ViewerConfiguration;
}

class HTMLMapper implements IMapper {

    map(element: HTMLElement): ViewerConfiguration {

        let config = {};
        for (let attrIdx = 0; attrIdx < element.attributes.length; ++attrIdx) {
            let attr = element.attributes.item(attrIdx);
            // map "object.property" to the right configuration place.
            let split = attr.nodeName.split('.');
            split.reduce((currentConfig, key, idx) => {
                //convert html-style to json-style
                let camelKey = kebabToCamel(key);
                if (idx === split.length - 1) {
                    currentConfig[camelKey] = attr.nodeValue;
                } else {
                    currentConfig[camelKey] = currentConfig[camelKey] || {};
                }
                return currentConfig[camelKey];
            }, config);
        }

        return config;
    }
}

class JSONMapper implements IMapper {
    map(rawSource: any) {
        return JSON.parse(rawSource);
    }
}

// TODO - Dom configuration mapper.
class DOMMapper {

}

export class MapperManager {

    private mappers: { [key: string]: IMapper };
    public static DefaultMapper = 'json';

    constructor() {
        this.mappers = {
            "html": new HTMLMapper(),
            "json": new JSONMapper()
        }
    }

    public getMapper(type: string) {
        if (!this.mappers[type]) {
            Tools.Error("No mapper defined for " + type);
        }
        return this.mappers[type] || this.mappers[MapperManager.DefaultMapper];
    }

    public registerMapper(type: string, mapper: IMapper) {
        this.mappers[type] = mapper;
    }

}

export let mapperManager = new MapperManager();
export default mapperManager;