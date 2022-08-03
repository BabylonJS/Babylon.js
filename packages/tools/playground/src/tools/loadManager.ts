import { DecodeBase64ToBinary } from "@dev/core";
import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";

export class LoadManager {
    private _previousHash = "";

    public constructor(public globalState: GlobalState) {
        // Check the url to prepopulate data
        this._checkHash();
        window.addEventListener("hashchange", () => this._checkHash());

        globalState.onLoadRequiredObservable.add((id) => {
            globalState.onDisplayWaitRingObservable.notifyObservers(true);

            const prevHash = location.hash;
            location.hash = id;

            if (location.hash === prevHash) {
                this._loadPlayground(id);
            }
        });
    }

    private _cleanHash() {
        const substr = location.hash[1] === "#" ? 2 : 1;
        const splits = decodeURIComponent(location.hash.substr(substr)).split("#");

        if (splits.length > 2) {
            splits.splice(2, splits.length - 2);
        }

        location.hash = splits.join("#");
    }

    private _checkHash() {
        let pgHash = "";
        if (location.search && (!location.pathname || location.pathname === "/") && !location.hash) {
            const query = Utilities.ParseQuery();
            if (query.pg) {
                pgHash = "#" + query.pg + "#" + (query.revision || "0");
            }
        } else if (location.hash) {
            // in case there is a query post-hash, we need to clean it
            const splitQuery = location.hash.split("?");
            if (splitQuery[1]) {
                location.hash = splitQuery[0];
                // this will force a reload
                location.search = splitQuery[1];
            }
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
            const match = pgHash.match(/^(#[A-Za-z\d]*)(%23)([\d]+)$/);
            if (match) {
                pgHash = match[1] + "#" + match[3];
                parent.location.hash = pgHash;
            }
            this._previousHash = pgHash;
            this._loadPlayground(pgHash.substr(1));
        }
    }

    private _loadPlayground(id: string) {
        this.globalState.loadingCodeInProgress = true;
        try {
            const xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = () => {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        if (xmlHttp.responseText.indexOf("class Playground") !== -1) {
                            if (this.globalState.language === "JS") {
                                Utilities.SwitchLanguage("TS", this.globalState, true);
                            }
                        } else {
                            // If we're loading JS content and it's TS page
                            if (this.globalState.language === "TS") {
                                Utilities.SwitchLanguage("JS", this.globalState, true);
                            }
                        }

                        const snippet = JSON.parse(xmlHttp.responseText);

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

                        // Extract code
                        const payload = JSON.parse(snippet.jsonPayload);
                        let code: string = payload.code.toString();

                        if (payload.unicode) {
                            // Need to decode
                            const encodedData = payload.unicode;
                            const decoder = new TextDecoder("utf8");

                            code = decoder.decode(DecodeBase64ToBinary(encodedData));
                        }

                        this.globalState.onCodeLoaded.notifyObservers(code);

                        this.globalState.onMetadataUpdatedObservable.notifyObservers();
                    }
                }
            };

            if (id[0] === "#") {
                id = id.substr(1);
            }

            this.globalState.currentSnippetToken = id.split("#")[0];
            if (!id.split("#")[1]) {
                id += "#0";
            }

            xmlHttp.open("GET", this.globalState.SnippetServerUrl + "/" + id.replace(/#/g, "/"));
            xmlHttp.send();
        } catch (e) {
            this.globalState.loadingCodeInProgress = false;
            this.globalState.onCodeLoaded.notifyObservers("");
        }
    }
}
