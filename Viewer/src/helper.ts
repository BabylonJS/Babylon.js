export function isUrl(urlToCheck: string): boolean {
    if (urlToCheck.indexOf('http') === 0 || urlToCheck.indexOf('/') === 0 || urlToCheck.indexOf('./') === 0 || urlToCheck.indexOf('../') === 0) {
        return true;
    }
    return false;
}

export function kebabToCamel(s) {
    return s.replace(/(\-\w)/g, function (m) { return m[1].toUpperCase(); });
}

//https://gist.github.com/youssman/745578062609e8acac9f
export function camelToKebab(str) {
    return !str ? null : str.replace(/([A-Z])/g, function (g) { return '-' + g[0].toLowerCase() });
}