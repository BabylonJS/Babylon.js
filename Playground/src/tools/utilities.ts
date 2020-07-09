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
}