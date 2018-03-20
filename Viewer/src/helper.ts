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
    return s.replace(/(\-\w)/g, function (m) { return m[1].toUpperCase(); });
}

//https://gist.github.com/youssman/745578062609e8acac9f
/**
 * Convert a string from camelCase to kebab-case
 * @param str string to convert
 */
export function camelToKebab(str) {
    return !str ? null : str.replace(/([A-Z])/g, function (g) { return '-' + g[0].toLowerCase() });
}