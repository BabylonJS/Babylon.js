import type { GlobalState } from "../globalState";

export class Utilities {
    public static FastEval(code: string) {
        const head = document.getElementsByTagName("head")[0];
        const script = document.createElement("script");
        script.setAttribute("type", "text/javascript");

        script.innerHTML = `try {${code};}
        catch(e) {
            handleException(e);
        }`;

        head.appendChild(script);
    }

    public static ParseQuery() {
        const queryString = location.search;
        const query: any = {};
        const pairs = (queryString[0] === "?" ? queryString.substr(1) : queryString).split("&");
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i].split("=");
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
        }
        return query;
    }

    public static ReadStringFromStore(key: string, defaultValue: string, useSession = false): string {
        const storage = useSession ? sessionStorage : localStorage;

        if (storage.getItem(key) === null) {
            return defaultValue;
        }

        return storage.getItem(key)!;
    }

    public static ReadBoolFromStore(key: string, defaultValue: boolean): boolean {
        if (localStorage.getItem(key) === null) {
            return defaultValue;
        }

        return localStorage.getItem(key) === "true";
    }

    public static StoreStringToStore(key: string, value: string, useSession = false): void {
        const storage = useSession ? sessionStorage : localStorage;
        storage.setItem(key, value);
    }

    public static StoreBoolToStore(key: string, value: boolean): void {
        localStorage.setItem(key, value ? "true" : "false");
    }

    public static CheckSafeMode(message: string) {
        if (Utilities.ReadBoolFromStore("safe-mode", false)) {
            return window.confirm(message);
        }

        return true;
    }

    public static SwitchLanguage(language: string, globalState: GlobalState, force?: boolean) {
        if (force || window.confirm("Are you sure you want to switch the language (You will lose your current project if it was not saved before)?")) {
            Utilities.StoreStringToStore("language", language);
            globalState.language = language;
            globalState.currentCode = "";
            globalState.onLanguageChangedObservable.notifyObservers();
        }
    }
}
