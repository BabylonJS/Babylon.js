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
}