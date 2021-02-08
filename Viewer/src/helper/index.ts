import * as deepmerge from 'deepmerge';

let expDm = deepmerge['default'];
export { expDm as deepmerge };

/**
 * Is the provided string a URL?
 *
 * @param urlToCheck the url to inspect
 */
export function isUrl(urlToCheck: string): boolean {
    if (urlToCheck.indexOf('http') === 0 || urlToCheck.indexOf('/') === 0 || urlToCheck.indexOf('./') === 0 || urlToCheck.indexOf('../') === 0) {
        return true;
    }
    return false;
}

/**
 * Convert a string from kebab-case to camelCase
 * @param s string to convert
 */
export function kebabToCamel(s) {
    return s.replace(/(\-\w)/g, function(m) { return m[1].toUpperCase(); });
}

//https://gist.github.com/youssman/745578062609e8acac9f
/**
 * Convert a string from camelCase to kebab-case
 * @param str string to convert
 */
export function camelToKebab(str) {
    return !str ? null : str.replace(/([A-Z])/g, function(g) { return '-' + g[0].toLowerCase(); });
}

/**
 * This will extend an object with configuration values.
 * What it practically does it take the keys from the configuration and set them on the object.
 * If the configuration is a tree, it will traverse into the tree.
 * @param object the object to extend
 * @param config the configuration object that will extend the object
 */
export function extendClassWithConfig(object: any, config: any) {
    if (!config || typeof config !== 'object') { return; }
    Object.keys(config).forEach(function(key) {
        if (key in object && typeof object[key] !== 'function') {
            // if (typeof object[key] === 'function') return;
            // if it is an object, iterate internally until reaching basic types
            // but null is an object so if its null and config[key] is not an object eg. number, the number should be set
            if ((typeof object[key] === 'object') && (object[key] !== null || typeof config[key] === "object")) {
                extendClassWithConfig(object[key], config[key]);
            } else {
                if (config[key] !== undefined) {
                    object[key] = config[key];
                }
            }
        }
    });
}
