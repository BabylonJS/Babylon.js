export function isUrl(urlToCheck: string): boolean {
    if (urlToCheck.indexOf('http') === 0 || urlToCheck.indexOf('/') === 0 || urlToCheck.indexOf('./') === 0 || urlToCheck.indexOf('../') === 0) {
        return true;
    }
    return false;
}

export function loadFile(url: string): Promise<any> {
    /*let cacheReference = this.configurationCache;
    if (cacheReference[url]) {
        return Promise.resolve(cacheReference[url]);
    }*/

    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.send();
        xhr.onreadystatechange = function () {
            var DONE = 4;
            var OK = 200;
            if (xhr.readyState === DONE) {
                if (xhr.status === OK) {
                    //cacheReference[url] = xhr.responseText;
                    resolve(xhr.responseText); // 'This is the returned text.'
                }
            } else {
                console.log('Error: ' + xhr.status, url);
                reject('Error: ' + xhr.status); // An error occurred during the request.
            }
        }
    });
}

export function kebabToCamel(s) {
    return s.replace(/(\-\w)/g, function (m) { return m[1].toUpperCase(); });
}

//https://gist.github.com/youssman/745578062609e8acac9f
export function camelToKebab(str) {
    return !str ? null : str.replace(/([A-Z])/g, function (g) { return '-' + g[0].toLowerCase() });
}