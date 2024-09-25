import type { AssetContainer } from "core/assetContainer";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

/**
 * Defines how the parser contract is defined.
 * These parsers are used to parse a list of specific assets (like particle systems, etc..)
 */
export type BabylonFileParser = (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => void;

/**
 * Defines how the individual parser contract is defined.
 * These parser can parse an individual asset
 */
export type IndividualBabylonFileParser = (parsedData: any, scene: Scene, rootUrl: string) => any;

/**
 * Stores the list of available parsers in the application.
 */
const _BabylonFileParsers: { [key: string]: BabylonFileParser } = {};

/**
 * Stores the list of available individual parsers in the application.
 */
const _IndividualBabylonFileParsers: { [key: string]: IndividualBabylonFileParser } = {};

/**
 * Adds a parser in the list of available ones
 * @param name Defines the name of the parser
 * @param parser Defines the parser to add
 */
export function AddParser(name: string, parser: BabylonFileParser): void {
    _BabylonFileParsers[name] = parser;
}

/**
 * Gets a general parser from the list of available ones
 * @param name Defines the name of the parser
 * @returns the requested parser or null
 */
export function GetParser(name: string): Nullable<BabylonFileParser> {
    if (_BabylonFileParsers[name]) {
        return _BabylonFileParsers[name];
    }

    return null;
}

/**
 * Adds n individual parser in the list of available ones
 * @param name Defines the name of the parser
 * @param parser Defines the parser to add
 */
export function AddIndividualParser(name: string, parser: IndividualBabylonFileParser): void {
    _IndividualBabylonFileParsers[name] = parser;
}

/**
 * Gets an individual parser from the list of available ones
 * @param name Defines the name of the parser
 * @returns the requested parser or null
 */
export function GetIndividualParser(name: string): Nullable<IndividualBabylonFileParser> {
    if (_IndividualBabylonFileParsers[name]) {
        return _IndividualBabylonFileParsers[name];
    }

    return null;
}

/**
 * Parser json data and populate both a scene and its associated container object
 * @param jsonData Defines the data to parse
 * @param scene Defines the scene to parse the data for
 * @param container Defines the container attached to the parsing sequence
 * @param rootUrl Defines the root url of the data
 */
export function Parse(jsonData: any, scene: Scene, container: AssetContainer, rootUrl: string): void {
    for (const parserName in _BabylonFileParsers) {
        if (Object.prototype.hasOwnProperty.call(_BabylonFileParsers, parserName)) {
            _BabylonFileParsers[parserName](jsonData, scene, container, rootUrl);
        }
    }
}
