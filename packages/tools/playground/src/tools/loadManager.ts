/* eslint-disable jsdoc/require-jsdoc */
import { Logger } from "@dev/core";
import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";
import { ReadLastLocal } from "./localSession";
import { ManifestVersion } from "./snippet";
import { FetchSnippet, ParseSnippetResponse } from "@tools/snippet-loader";
import type { ISnippetServerResponse, IPlaygroundSnippetResult } from "@tools/snippet-loader";

const HydrationObserverTimeoutMs = 10000;
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
                // Setting the same hash does not fire hashchange, so load it directly here.
                this._loadPlayground(id, false);
            }
        });

        globalState.onLocalLoadRequiredObservable.add(async () => {
            globalState.onDisplayWaitRingObservable.notifyObservers(true);
            const json = await this._pickJsonFileAsync();
            if (json) {
                location.hash = "";
                this._processJsonPayloadFromString(json);
            } else {
                globalState.onDisplayWaitRingObservable.notifyObservers(false);
            }
        });
    }

    private _notifyLoadFailure(message: string) {
        Logger.Error(message);
        this.globalState.loadingCodeInProgress = false;
        this.globalState.onCodeLoaded.notifyObservers("");
        this.globalState.onDisplayWaitRingObservable.notifyObservers(false);
        this.globalState.onErrorObservable.notifyObservers({ message });
    }

    private async _waitForHydrationObserverAsync() {
        const startTime = Date.now();

        while (!this.globalState.onV2HydrateRequiredObservable.hasObservers()) {
            if (Date.now() - startTime >= HydrationObserverTimeoutMs) {
                this._notifyLoadFailure("The playground editor timed out while preparing the loaded snippet.");
                return false;
            }

            // eslint-disable-next-line
            await new Promise((res) => setTimeout(res, 10));
        }

        return true;
    }

    private async _pickJsonFileAsync() {
        try {
            // Show native file picker
            const [handle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: "Playground JSON Files",
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        accept: { "application/json": [".json"] },
                    },
                ],
                multiple: false,
            });

            // Get the file from the handle
            const file = await handle.getFile();

            // Read the file as text
            const text = await file.text();

            return text; // This is the raw JSON string
        } catch (err: any) {
            if (err.name === "AbortError") {
                Logger.Warn("User canceled file selection");
            } else {
                Logger.Error("Error reading file:", err);
            }
            return null;
        }
    }

    private _cleanHash() {
        const substr = location.hash[1] === "#" ? 2 : 1;
        const splits = decodeURIComponent(location.hash.substring(substr)).split("#");

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
        // Manual engine switches trigger a full reload.
        // Consume the one-shot flag here so only the next hash-based load can suppress the dialog.
        const suppressEngineSwitchDialog = Utilities.ConsumeManualEngineSwitchReload();
        if (pgHash) {
            const match = pgHash.match(/^(#[A-Za-z\d]*)(%23)([\d]+)$/);
            if (match) {
                pgHash = match[1] + "#" + match[3];
                parent.location.hash = pgHash;
            }
            this._previousHash = pgHash;
            this._loadPlayground(pgHash.substring(1), suppressEngineSwitchDialog);
        }
    }

    /**
     * Processes a parsed playground snippet result from the snippet loader,
     * applying engine switch logic and hydrating the editor.
     * @param result - The parsed playground snippet result
     * @param suppressEngineSwitchDialog - Whether to suppress the engine switch dialog
     */
    private async _processPlaygroundResultAsync(result: IPlaygroundSnippetResult, suppressEngineSwitchDialog = false) {
        // Apply metadata
        this.globalState.currentSnippetTitle = result.metadata.name || "";
        this.globalState.currentSnippetDescription = result.metadata.description || "";
        this.globalState.currentSnippetTags = result.metadata.tags || "";

        // Check the engine
        if (result.engineType && ["WebGL1", "WebGL2", "WebGPU"].includes(result.engineType)) {
            const targetEngine = result.engineType;
            const url = new URL(window.location.href);
            const engineInURL = url.searchParams.get("engine") || url.search.includes("webgpu");
            const currentEngine = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);
            if (!engineInURL && currentEngine !== targetEngine && !suppressEngineSwitchDialog) {
                if (
                    await this.globalState.showEngineSwitchDialogAsync({
                        currentEngine,
                        targetEngine,
                    })
                ) {
                    Utilities.StoreStringToStore("engineVersion", targetEngine, true);
                    this.globalState.onEngineChangedObservable.notifyObservers(targetEngine);
                }
            }
        }

        if (result.isMultiFile && result.manifest) {
            const v2 = result.manifest;

            if (v2.language !== this.globalState.language) {
                Utilities.SwitchLanguage(v2.language, this.globalState, true);
            }

            // In the case we're loading from a #local revision id,
            // The execution flow reaches this block before MonacoManager has been instantiated
            // And the observable attached. Instead of refactoring the instantiation flow
            // We can handle this one-off case here
            const hasHydrationObserver = await this._waitForHydrationObserverAsync();
            if (!hasHydrationObserver) {
                return;
            }
            this.globalState.onV2HydrateRequiredObservable.notifyObservers({
                v: ManifestVersion,
                files: v2.files,
                entry: v2.entry || (v2.language === "JS" ? "index.js" : "index.ts"),
                imports: v2.imports || {},
                language: v2.language,
            });

            this.globalState.loadingCodeInProgress = false;
            this.globalState.onMetadataUpdatedObservable.notifyObservers();
            return;
        }

        // V1 legacy snippet — the snippet loader already appended export statements
        // and normalised the code into a files map
        const language = result.language;
        if (language !== this.globalState.language) {
            Utilities.SwitchLanguage(language, this.globalState, true);
        }

        const fileName = language === "TS" ? "index.ts" : "index.js";
        const code = result.files[fileName] ?? result.code;

        queueMicrotask(() => {
            this.globalState.onV2HydrateRequiredObservable.notifyObservers({
                v: ManifestVersion,
                files: { [fileName]: code },
                entry: fileName,
                imports: {},
                language,
            });
        });

        this.globalState.loadingCodeInProgress = false;
        this.globalState.onMetadataUpdatedObservable.notifyObservers();
    }

    /**
     * Processes a raw JSON payload string (from local storage or file).
     * Parses via the snippet loader and delegates to _processPlaygroundResultAsync.
     * @param data - The raw JSON string to parse
     * @param suppressEngineSwitchDialog - Whether to suppress the engine switch dialog
     */
    private _processJsonPayloadFromString(data: string, suppressEngineSwitchDialog = false) {
        // eslint-disable-next-line github/no-then
        void this._processJsonPayloadFromStringAsync(data, suppressEngineSwitchDialog).catch((error) => {
            const message = error instanceof Error ? error.message : "Failed to process the playground snippet.";
            this._notifyLoadFailure(message);
        });
    }

    private async _processJsonPayloadFromStringAsync(data: string, suppressEngineSwitchDialog = false) {
        const response = JSON.parse(data) as ISnippetServerResponse;
        const snippetId = this.globalState.currentSnippetToken ? `${this.globalState.currentSnippetToken}#${this.globalState.currentSnippetRevision || "0"}` : "local#0";
        const result = await ParseSnippetResponse(response, snippetId, { moduleFormat: "esm" });

        if (result.type !== "playground") {
            throw new Error(`Expected a playground snippet but got "${result.type}".`);
        }

        await this._processPlaygroundResultAsync(result, suppressEngineSwitchDialog);
    }

    private _loadPlayground(id: string, suppressEngineSwitchDialog = false) {
        this.globalState.loadingCodeInProgress = true;
        try {
            if (id[0] === "#") {
                id = id.substring(1);
            }

            this.globalState.currentSnippetToken = id.split("#")[0];
            this.globalState.currentSnippetRevision = id.split("#")[1] ?? "0";
            if (!id.split("#")[1]) {
                id += "#0";
            }
            if (this.globalState.currentSnippetRevision === "local") {
                const localRevision = ReadLastLocal(this.globalState);
                if (localRevision) {
                    this._processJsonPayloadFromString(localRevision, suppressEngineSwitchDialog);
                    return;
                }
            }

            // Use the snippet loader to fetch and parse the snippet
            // eslint-disable-next-line github/no-then
            void this._fetchAndProcessSnippetAsync(id, suppressEngineSwitchDialog).catch((error) => {
                const message = error instanceof Error ? error.message : `Failed to load playground ${id}.`;
                this._notifyLoadFailure(message);
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : `Failed to start loading playground ${id}.`;
            this._notifyLoadFailure(message);
        }
    }

    private async _fetchAndProcessSnippetAsync(id: string, suppressEngineSwitchDialog: boolean) {
        const serverResponse = await FetchSnippet(id, this.globalState.SnippetServerUrl);
        const result = await ParseSnippetResponse(serverResponse, id, { moduleFormat: "esm" });

        if (result.type !== "playground") {
            throw new Error(`Expected a playground snippet but got "${result.type}".`);
        }

        await this._processPlaygroundResultAsync(result, suppressEngineSwitchDialog);
    }
}
