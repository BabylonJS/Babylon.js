export class Utilities {
    public static FastEval(code: string) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
    
        script.innerHTML = `try {${code};}
        catch(e) {
            handleException(e);
        }`;
    
        head.appendChild(script);
    }

    public static ParseQuery() {
        let queryString = location.search;
        var query: any = {};
        var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }

    public static ReadBoolFromStore(key: string, defaultValue: boolean): boolean {
        if (localStorage.getItem(key) === null) {
            return defaultValue;
        }

        return localStorage.getItem(key) === "true";
    }

    public static StoreBoolFromStore(key: string, value: boolean): void {
        localStorage.setItem(key, value ? "true" : "false");
    }
}