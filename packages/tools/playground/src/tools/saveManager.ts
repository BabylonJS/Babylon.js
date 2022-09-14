import { EncodeArrayBufferToBase64 } from "@dev/core";
import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";

export class SaveManager {
    public constructor(public globalState: GlobalState) {
        globalState.onSaveRequiredObservable.add(() => {
            if (!this.globalState.currentSnippetTitle || !this.globalState.currentSnippetDescription || !this.globalState.currentSnippetTags) {
                this.globalState.onMetadataWindowHiddenObservable.addOnce((status) => {
                    if (status) {
                        this._saveSnippet();
                    }
                });
                this.globalState.onDisplayMetadataObservable.notifyObservers(true);
                return;
            }
            this._saveSnippet();
        });
    }

    private _saveSnippet() {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    if (location.pathname && location.pathname.indexOf("pg/") !== -1) {
                        // full path with /pg/??????
                        if (location.pathname.indexOf("revision") !== -1) {
                            location.href = location.href.replace(/revision\/(\d+)/, "revision/" + snippet.version);
                        } else {
                            location.href = location.href + "/revision/" + snippet.version;
                        }
                    } else if (location.search && location.search.indexOf("pg=") !== -1) {
                        // query string with ?pg=??????
                        const currentQuery = Utilities.ParseQuery();
                        if (currentQuery.revision) {
                            location.href = location.href.replace(/revision=(\d+)/, "revision=" + snippet.version);
                        } else {
                            location.href = location.href + "&revision=" + snippet.version;
                        }
                    } else {
                        // default behavior!
                        const baseUrl = location.href.replace(location.hash, "");
                        let newUrl = baseUrl + "#" + snippet.id;
                        newUrl = newUrl.replace("##", "#");
                        this.globalState.currentSnippetToken = snippet.id;
                        if (snippet.version && snippet.version !== "0") {
                            newUrl += "#" + snippet.version;
                        }
                        location.href = newUrl;
                    }

                    this.globalState.onSavedObservable.notifyObservers();
                } else {
                    this.globalState.onErrorObservable.notifyObservers({ message: "Unable to save your code. It may be too long." });
                }
            }
        };

        xmlHttp.open("POST", this.globalState.SnippetServerUrl + (this.globalState.currentSnippetToken ? "/" + this.globalState.currentSnippetToken : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        const encoder = new TextEncoder();
        const buffer = encoder.encode(this.globalState.currentCode);

        // Check if we need to encode it to store the unicode characters
        let testData = "";

        for (let i = 0; i < buffer.length; i++) {
            testData += String.fromCharCode(buffer[i]);
        }

        const payLoad = JSON.stringify({
            code: this.globalState.currentCode,
            unicode: testData !== this.globalState.currentCode ? EncodeArrayBufferToBase64(buffer) : undefined,
        });

        const dataToSend = {
            payload: payLoad,
            name: this.globalState.currentSnippetTitle,
            description: this.globalState.currentSnippetDescription,
            tags: this.globalState.currentSnippetTags,
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }
}
