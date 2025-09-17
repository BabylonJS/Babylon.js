import { EncodeArrayBufferToBase64, Logger } from "@dev/core";
import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";

/**
 * Handles saving playground code and multi-file manifests.
 */
export class SaveManager {
    /**
     * Creates a new SaveManager.
     * @param globalState Shared global state instance.
     */
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

        globalState.onLocalSaveRequiredObservable.add(() => {
            if (!this.globalState.currentSnippetTitle || !this.globalState.currentSnippetDescription || !this.globalState.currentSnippetTags) {
                this.globalState.onMetadataWindowHiddenObservable.addOnce((status) => {
                    if (status) {
                        this._localSaveSnippet();
                    }
                });
                this.globalState.onDisplayMetadataObservable.notifyObservers(true);
                return;
            }
            this._localSaveSnippet();
        });
    }

    private _getSnippetData() {
        const isMulti = this.globalState.isMultiFile === true;
        const activeEngineVersion = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);

        let codeToSave: string;

        if (isMulti) {
            const entry = this.globalState.entryFilePath || (this.globalState.language === "JS" ? "index.js" : "index.ts");

            const files = Object.keys(this.globalState.files || {}).length ? this.globalState.files : { [entry]: this.globalState.currentCode || "" };

            const v2 = {
                v: 2,
                language: (this.globalState.language === "JS" ? "JS" : "TS") as "JS" | "TS",
                entry,
                imports: this.globalState.importsMap || {},
                files,
            };

            codeToSave = JSON.stringify(v2);
        } else {
            codeToSave = this.globalState.currentCode;
        }

        const encoder = new TextEncoder();
        const buffer = encoder.encode(codeToSave);

        let testData = "";
        for (let i = 0; i < buffer.length; i++) {
            testData += String.fromCharCode(buffer[i]);
        }

        const payLoad = JSON.stringify({
            code: codeToSave,
            unicode: testData !== codeToSave ? EncodeArrayBufferToBase64(buffer) : undefined,
            engine: activeEngineVersion,
        });

        const dataToSend = {
            payload: payLoad,
            name: this.globalState.currentSnippetTitle,
            description: this.globalState.currentSnippetDescription,
            tags: this.globalState.currentSnippetTags,
        };

        return JSON.stringify(dataToSend);
    }

    private async _saveJsonFileAsync(snippetData: string) {
        try {
            // Open "Save As" dialog
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: "playground.json",
                types: [
                    {
                        description: "JSON Files",
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        accept: { "application/json": [".json"] },
                    },
                ],
            });

            // Create a writable stream
            const writable = await handle.createWritable();

            // Write the JSON string (pretty-printed)
            await writable.write(snippetData);

            // Close the file
            await writable.close();
        } catch (err: any) {
            if (err.name === "AbortError") {
                Logger.Warn("User canceled save dialog");
            } else {
                Logger.Error("Error saving file:", err);
            }
        }
    }

    private _localSaveSnippet() {
        void this._saveJsonFileAsync(this._getSnippetData());
    }

    private _saveSnippet() {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    if (location.pathname && location.pathname.indexOf("pg/") !== -1) {
                        if (location.pathname.indexOf("revision") !== -1) {
                            location.href = location.href.replace(/revision\/(\d+)/, "revision/" + snippet.version);
                        } else {
                            location.href = location.href + "/revision/" + snippet.version;
                        }
                    } else if (location.search && location.search.indexOf("pg=") !== -1) {
                        const currentQuery = Utilities.ParseQuery();
                        if (currentQuery.revision) {
                            location.href = location.href.replace(/revision=(\d+)/, "revision=" + snippet.version);
                        } else {
                            location.href = location.href + "&revision=" + snippet.version;
                        }
                    } else {
                        const baseUrl = location.href.replace(location.hash, "");
                        let toolkit = "";

                        if (Utilities.ReadBoolFromStore("babylon-toolkit", false) && location.href.indexOf("BabylonToolkit") === -1) {
                            toolkit = "?BabylonToolkit";
                        }

                        let newUrl = baseUrl + toolkit + "#" + snippet.id;
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

        xmlHttp.send(this._getSnippetData());
    }
}
