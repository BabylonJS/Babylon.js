import { GlobalState } from '../globalState';
import { Utilities } from './utilities';

export class LoadManager {
    private _previousHash = "";

    public constructor(public globalState: GlobalState) {  
        // Check the url to prepopulate data        
        this._checkHash();
        window.addEventListener("hashchange", () => this._checkHash());
    }

    private _cleanHash() {
        var substr = location.hash[1]==='#' ? 2 : 1
        var splits = decodeURIComponent(location.hash.substr(substr)).split("#");

        if (splits.length > 2) {
            splits.splice(2, splits.length - 2);
        }

        location.hash = splits.join("#");
    };

    private _checkHash() {
        let pgHash = "";
        if (location.search && (!location.pathname  || location.pathname === '/') && !location.hash) {
            var query = Utilities.ParseQuery();
            if (query.pg) {
                pgHash = "#" + query.pg + "#" + (query.revision || "0")
            }
        } else if (location.hash) {
            if (this._previousHash !== location.hash) {
                this._cleanHash();
                pgHash = location.hash;
            }
        } else if (location.pathname) {
            const pgMatch = location.pathname.match(/\/pg\/(.*)/);
            const withRevision = location.pathname.match(/\/pg\/(.*)\/revision\/(\d*)/);
            if (pgMatch || withRevision) {
                if (withRevision) {
                    pgHash = "#" + withRevision[1] + "#" + withRevision[2];
                } else {
                    pgHash = "#" + pgMatch![1] + "#0";
                }
            }
        }
        if (pgHash) {
            var match = pgHash.match(/^(#[A-Za-z\d]*)(%23)([\d]+)$/);
            if (match) {
                pgHash = match[1] + '#' + match[3];
                parent.location.hash = pgHash;
            }
            this._previousHash = pgHash;
            this.globalState.loadingCodeInProgress = true;
            this._loadPlayground(pgHash.substr(1))
        }        
    }

    private _loadPlayground(id: string) {
        try {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = () => {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {

                        if (xmlHttp.responseText.indexOf("class Playground") !== -1) {
                            if (this.globalState.language === "JS") {
                                Utilities.SwitchLanguage("TS", this.globalState);
                            }
                        } else { // If we're loading JS content and it's TS page
                            if (this.globalState.language === "TS") {
                                Utilities.SwitchLanguage("JS", this.globalState);
                            }
                        }

                        var snippet = JSON.parse(xmlHttp.responseText);

                        // Check if title / descr / tags are already set
                        if (snippet.name != null && snippet.name != "") {
                            this.globalState.currentSnippetTitle = snippet.name;
                        } else {
                            this.globalState.currentSnippetTitle = "";
                        }

                        if (snippet.description != null && snippet.description != "") {
                            this.globalState.currentSnippetDescription = snippet.description;
                        } else {
                            this.globalState.currentSnippetDescription = "";
                        }

                        if (snippet.tags != null && snippet.tags != "") {
                            this.globalState.currentSnippetTags = snippet.tags;
                        } else {
                            this.globalState.currentSnippetTags = "";
                        }

                        this.globalState.onCodeLoaded.notifyObservers(JSON.parse(snippet.jsonPayload).code.toString());
                         
                        this.globalState.onMetadataUpdatedObservable.notifyObservers();
                    }
                }
            }

            this.globalState.currentSnippetToken = id.split("#")[0];
            if (!id.split("#")[1]) id += "#0";

            xmlHttp.open("GET", this.globalState.SnippetServerUrl + "/" + id.replace("#", "/"));
            xmlHttp.send();
        } catch (e) {
            this.globalState.loadingCodeInProgress = false;
            this.globalState.onCodeLoaded.notifyObservers("");
        }
    }
}