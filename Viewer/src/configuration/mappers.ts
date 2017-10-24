import { Tools } from 'babylonjs';
import { ViewerConfiguration } from './configuration';

import { kebabToCamel } from '../helper';

import * as merge from 'lodash.merge';

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
                    let val: any = attr.nodeValue;
                    if (val === "true") {
                        val = true;
                    } else if (val === "false") {
                        val = false;
                    } else {
                        let number = parseFloat(val);
                        if (!isNaN(number)) {
                            val = number;
                        }
                    }
                    currentConfig[camelKey] = val;
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
class DOMMapper implements IMapper {

    map(baseElement: HTMLElement): ViewerConfiguration {
        let htmlMapper = new HTMLMapper();
        let config = htmlMapper.map(baseElement);

        let traverseChildren = function (element: HTMLElement, partConfig) {
            let children = element.children;
            if (children.length) {
                for (let i = 0; i < children.length; ++i) {
                    let item = <HTMLElement>children.item(i);
                    let configMapped = htmlMapper.map(item);
                    let key = kebabToCamel(item.nodeName.toLowerCase());
                    if (item.attributes.getNamedItem('array') && item.attributes.getNamedItem('array').nodeValue === 'true') {
                        partConfig[key] = [];
                    } else {
                        if (element.attributes.getNamedItem('array') && element.attributes.getNamedItem('array').nodeValue === 'true') {
                            partConfig.push(configMapped)
                        } else if (partConfig[key]) {
                            //exists already! problem... probably an array
                            element.setAttribute('array', 'true');
                            let oldItem = partConfig[key];
                            partConfig = [oldItem, configMapped]
                        } else {
                            partConfig[key] = configMapped;
                        }
                    }
                    traverseChildren(item, partConfig[key] || configMapped);
                }
            }
            return partConfig;
        }

        traverseChildren(baseElement, config);


        return config;
    }

}

export class MapperManager {

    private mappers: { [key: string]: IMapper };
    public static DefaultMapper = 'json';

    constructor() {
        this.mappers = {
            "html": new HTMLMapper(),
            "json": new JSONMapper(),
            "dom": new DOMMapper()
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