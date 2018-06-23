/**
 * Is the provided string a URL?
 *
 * @param urlToCheck the url to inspect
 */
export declare function isUrl(urlToCheck: string): boolean;
/**
 * Convert a string from kebab-case to camelCase
 * @param s string to convert
 */
export declare function kebabToCamel(s: any): any;
/**
 * Convert a string from camelCase to kebab-case
 * @param str string to convert
 */
export declare function camelToKebab(str: any): any;
/**
 * This will extend an object with configuration values.
 * What it practically does it take the keys from the configuration and set them on the object.
 * I the configuration is a tree, it will traverse into the tree.
 * @param object the object to extend
 * @param config the configuration object that will extend the object
 */
export declare function extendClassWithConfig(object: any, config: any): void;
