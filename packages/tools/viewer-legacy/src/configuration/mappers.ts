import { Tools } from "core/Misc/tools";
import type { ViewerConfiguration } from "./configuration";

// eslint-disable-next-line import/no-internal-modules
import { kebabToCamel } from "../helper/index";

/**
 * This is the mapper's interface. Implement this function to create your own mapper and register it at the mapper manager
 */
export interface IMapper {
    map(rawSource: any): ViewerConfiguration;
}

/**
 * This is a simple HTML mapper.
 * This mapper parses a single HTML element and returns the configuration from its attributes.
 * it parses numbers and boolean values to the corresponding variable types.
 * The following HTML element:
 *  <div test="1" random-flag="true" a.string.object="test"> will result in the following configuration:
 *
 *  {
 *      test: 1, //a number!
 *      randomFlag: boolean, //camelCase and boolean
 *      a: {
 *          string: {
 *              object: "test" //dot-separated object levels
 *          }
 *      }
 *  }
 */
class HTMLMapper implements IMapper {
    /**
     * Map a specific element and get configuration from it
     * @param element the HTML element to analyze.
     * @returns a ViewerConfiguration object from the provided HTML Element
     */
    map(element: HTMLElement): ViewerConfiguration {
        const config = {};
        for (let attrIdx = 0; attrIdx < element.attributes.length; ++attrIdx) {
            const attr = element.attributes.item(attrIdx);
            if (!attr) {
                continue;
            }
            // map "object.property" to the right configuration place.
            const split = attr.nodeName.split(".");
            split.reduce((currentConfig: { [key: string]: any }, key, idx) => {
                //convert html-style to json-style
                const camelKey = kebabToCamel(key);
                if (idx === split.length - 1) {
                    let val: any = attr!.nodeValue; // firefox warns nodeValue is deprecated, but I found no sign of it anywhere.
                    if (val === "true") {
                        val = true;
                    } else if (val === "false") {
                        val = false;
                    } else if (val === "undefined") {
                        val = undefined;
                    } else if (val === "null") {
                        val = null;
                    } else {
                        const isnum = !isNaN(parseFloat(val)) && isFinite(val); ///^\d+$/.test(val);
                        if (isnum) {
                            const number = parseFloat(val);
                            if (!isNaN(number)) {
                                val = number;
                            }
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

/**
 * A simple string-to-JSON mapper.
 * This is the main mapper, used to analyze downloaded JSON-Configuration or JSON payload
 */
class JSONMapper implements IMapper {
    map(rawSource: string) {
        return JSON.parse(rawSource);
    }
}

/**
 * The DOM Mapper will traverse an entire DOM Tree and will load the configuration from the
 * DOM elements and attributes.
 */
class DOMMapper implements IMapper {
    /**
     * The mapping function that will convert HTML data to a viewer configuration object
     * @param baseElement the baseElement from which to start traversing
     * @returns a ViewerConfiguration object from the provided HTML Element
     */
    map(baseElement: HTMLElement): ViewerConfiguration {
        const htmlMapper = new HTMLMapper();
        const config = htmlMapper.map(baseElement);

        const traverseChildren = function (element: HTMLElement, partConfig: any) {
            const children = element.children;
            if (children.length) {
                for (let i = 0; i < children.length; ++i) {
                    const item = <HTMLElement>children.item(i);
                    // use the HTML Mapper to read configuration from a single element
                    const configMapped = htmlMapper.map(item);
                    const key = kebabToCamel(item.nodeName.toLowerCase());
                    if (item.attributes.getNamedItem("array") && item.attributes.getNamedItem("array")!.nodeValue === "true") {
                        partConfig[key] = [];
                    } else {
                        if (element.attributes.getNamedItem("array") && element.attributes.getNamedItem("array")!.nodeValue === "true") {
                            partConfig.push(configMapped);
                        } else if (partConfig[key]) {
                            //exists already! probably an array
                            element.setAttribute("array", "true");
                            const oldItem = partConfig[key];
                            partConfig = [oldItem, configMapped];
                        } else {
                            partConfig[key] = configMapped;
                        }
                    }
                    traverseChildren(item, partConfig[key] || configMapped);
                }
            }
            return partConfig;
        };

        traverseChildren(baseElement, config);

        return config;
    }
}

/**
 * The MapperManager manages the different implemented mappers.
 * It allows the user to register new mappers as well and use them to parse their own configuration data
 */
export class MapperManager {
    private _mappers: { [key: string]: IMapper };
    /**
     * The default mapper is the JSON mapper.
     */
    public static DefaultMapper = "json";

    constructor() {
        this._mappers = {
            html: new HTMLMapper(),
            json: new JSONMapper(),
            dom: new DOMMapper(),
        };
    }

    /**
     * Get a specific configuration mapper.
     *
     * @param type the name of the mapper to load
     * @returns the mapper
     */
    public getMapper(type: string) {
        if (!this._mappers[type]) {
            Tools.Error("No mapper defined for " + type);
        }
        return this._mappers[type];
    }

    /**
     * Use this function to register your own configuration mapper.
     * After a mapper is registered, it can be used to parse the specific type fo configuration to the standard ViewerConfiguration.
     * @param type the name of the mapper. This will be used to define the configuration type and/or to get the mapper
     * @param mapper The implemented mapper
     */
    public registerMapper(type: string, mapper: IMapper) {
        this._mappers[type] = mapper;
    }

    /**
     * Dispose the mapper manager and all of its mappers.
     */
    public dispose() {
        this._mappers = {};
    }
}

/**
 * mapperManager is a singleton of the type MapperManager.
 * The mapperManager can be disposed directly with calling mapperManager.dispose()
 * or indirectly with using BabylonViewer.disposeAll()
 */
export const mapperManager = new MapperManager();
