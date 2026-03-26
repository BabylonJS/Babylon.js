import { Logger } from "@dev/core";
import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";
import { GenerateV2Manifest, PackSnippetData } from "./snippet";
import { SaveSnippet } from "@tools/snippet-loader";
import type { IV2Manifest } from "@tools/snippet-loader";

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
        // eslint-disable-next-line github/no-then
        void this._saveSnippetAsync().catch((error) => {
            Logger.Error("Failed to save snippet:", error);
            this.globalState.onErrorObservable.notifyObservers({ message: "Unable to save your code. It may be too long." });
        });
    }

    private async _saveSnippetAsync() {
        const manifest = GenerateV2Manifest(this.globalState) as IV2Manifest;
        const activeEngineVersion = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);

        const result = await SaveSnippet(
            { type: "playground", manifest, engine: activeEngineVersion },
            {
                snippetUrl: this.globalState.SnippetServerUrl,
                snippetId: this.globalState.currentSnippetToken || undefined,
                metadata: {
                    name: this.globalState.currentSnippetTitle,
                    description: this.globalState.currentSnippetDescription,
                    tags: this.globalState.currentSnippetTags,
                },
            }
        );

        if (location.pathname && location.pathname.indexOf("pg/") !== -1) {
            let newHref: string;
            if (location.pathname.indexOf("revision") !== -1) {
                newHref = location.href.replace(/revision\/([\d]+)/, "revision/" + result.version);
            } else {
                newHref = location.href + "/revision/" + result.version;
            }
            this._replaceUrlSilently(newHref);
        } else if (location.search && location.search.indexOf("pg=") !== -1) {
            const currentQuery = Utilities.ParseQuery();
            let newHref: string;
            if (currentQuery.revision) {
                newHref = location.href.replace(/revision=([\d]+)/, "revision=" + result.version);
            } else {
                newHref = location.href + "&revision=" + result.version;
            }
            this._replaceUrlSilently(newHref);
        } else {
            const baseUrl = location.href.replace(location.hash, "");
            let toolkit = "";

            if (Utilities.ReadBoolFromStore("babylon-toolkit", false) && location.href.indexOf("BabylonToolkit") === -1) {
                toolkit = "?BabylonToolkit";
            }

            let newUrl = baseUrl + toolkit + "#" + result.id;
            newUrl = newUrl.replace("##", "#");
            this.globalState.currentSnippetToken = result.id;
            if (result.version && result.version !== "0") {
                newUrl += "#" + result.version;
            }
            this.globalState.currentSnippetRevision = result.version;
            this._replaceUrlSilently(newUrl);
        }

        this.globalState.onSavedObservable.notifyObservers();
    }
}
