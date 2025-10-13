import { Logger } from "@dev/core";
import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";
import { PackSnippetData } from "./snippet";

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
        void this._saveJsonFileAsync(PackSnippetData(this.globalState));
    }

    private _replaceUrlSilently(newUrl: string) {
        history.replaceState(null, "", newUrl);
    }

    private _saveSnippet() {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    if (location.pathname && location.pathname.indexOf("pg/") !== -1) {
                        let newHref = location.href;
                        if (location.pathname.indexOf("revision") !== -1) {
                            newHref = location.href.replace(/revision\/(\d+)/, "revision/" + snippet.version);
                        } else {
                            newHref = location.href + "/revision/" + snippet.version;
                        }
                        this._replaceUrlSilently(newHref);
                    } else if (location.search && location.search.indexOf("pg=") !== -1) {
                        const currentQuery = Utilities.ParseQuery();
                        let newHref = location.href;
                        if (currentQuery.revision) {
                            newHref = location.href.replace(/revision=(\d+)/, "revision=" + snippet.version);
                        } else {
                            newHref = location.href + "&revision=" + snippet.version;
                        }
                        this._replaceUrlSilently(newHref);
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
                        this.globalState.currentSnippetRevision = `#${snippet.version}`;
                        this._replaceUrlSilently(newUrl);
                    }

                    this.globalState.onSavedObservable.notifyObservers();
                } else {
                    this.globalState.onErrorObservable.notifyObservers({ message: "Unable to save your code. It may be too long." });
                }
            }
        };

        xmlHttp.open("POST", this.globalState.SnippetServerUrl + (this.globalState.currentSnippetToken ? "/" + this.globalState.currentSnippetToken : ""), true);
        xmlHttp.withCredentials = false;
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        xmlHttp.send(PackSnippetData(this.globalState));
    }
}
