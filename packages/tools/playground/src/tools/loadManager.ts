/* eslint-disable jsdoc/require-jsdoc */
import { DecodeBase64ToBinary, Logger } from "@dev/core";
import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";
import { ReadLastLocal } from "./localSession";
import type { SnippetData, SnippetPayload } from "./snippet";
import { ManifestVersion, type V2Manifest } from "./snippet";

const DecodeBase64ToString = (base64Data: string): string => {
    return atob(base64Data);
};

// Taken from 5.X StringUtils and added so that older playgrounds can still be loaded
// This can be removed once we no longer support loading playgrounds older than 5.X
const DecodeBase64ToBinaryReproduced = (base64Data: string): ArrayBuffer => {
    const decodedString = DecodeBase64ToString(base64Data);
    const bufferLength = decodedString.length;
    const bufferView = new Uint8Array(new ArrayBuffer(bufferLength));

    for (let i = 0; i < bufferLength; i++) {
        bufferView[i] = decodedString.charCodeAt(i);
    }

    return bufferView.buffer;
};
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

        globalState.onLocalLoadRequiredObservable.add(async () => {
            globalState.onDisplayWaitRingObservable.notifyObservers(true);
            const json = await this._pickJsonFileAsync();
            if (json) {
                location.hash = "";
                // eslint-disable-next-line
                this._processJsonPayloadAsync(json);
            } else {
                globalState.onDisplayWaitRingObservable.notifyObservers(false);
            }
        });
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
        if (pgHash) {
            const match = pgHash.match(/^(#[A-Za-z\d]*)(%23)([\d]+)$/);
            if (match) {
                pgHash = match[1] + "#" + match[3];
                parent.location.hash = pgHash;
            }
            this._previousHash = pgHash;
            this._loadPlayground(pgHash.substring(1));
        }
    }

    // These are potential variables defined by existing Playgrounds
    // That need to be exported in order to work in V2 format
    private readonly _jsFunctions = [
        "delayCreateScene",
        "createScene",
        "CreateScene",
        "createscene",

        // Engine
        "createEngine",
    ];
    private async _processJsonPayloadAsync(data: string) {
        const snippet = JSON.parse(data) as SnippetData;
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
        const payload = JSON.parse(snippet.jsonPayload ?? snippet.payload ?? "") as SnippetPayload;
        let code: string = payload.code.toString();

        if (payload.unicode) {
            // Need to decode
            const encodedData = payload.unicode;
            const decoder = new TextDecoder("utf8");

            code = decoder.decode((DecodeBase64ToBinary || DecodeBase64ToBinaryReproduced)(encodedData));
        }

        // check the engine
        if (payload.engine && ["WebGL1", "WebGL2", "WebGPU"].includes(payload.engine)) {
            // check if an engine is forced in the URL
            const url = new URL(window.location.href);
            const engineInURL = url.searchParams.get("engine") || url.search.includes("webgpu");
            // get the current engine
            const currentEngine = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);
            if (!engineInURL && currentEngine !== payload.engine) {
                if (
                    window.confirm(
                        `The engine version in this playground (${payload.engine}) is different from the one you are currently using (${currentEngine}).
Confirm to switch to ${payload.engine}, cancel to keep ${currentEngine}`
                    )
                ) {
                    Utilities.StoreStringToStore("engineVersion", payload.engine, true);
                    this.globalState.onEngineChangedObservable.notifyObservers(payload.engine);
                }
            }
        }

        try {
            const manifestPayload = JSON.parse(code);
            if (manifestPayload && manifestPayload.files && typeof manifestPayload.files === "object") {
                const v2 = manifestPayload as V2Manifest;

                if (v2.language !== this.globalState.language) {
                    Utilities.SwitchLanguage(v2.language, this.globalState, true);
                }

                // In the case we're loading from a #local revision id,
                // The execution flow reaches this block before MonacoManager has been instantiated
                // And the observable attached. Instead of refactoring the instantiation flow
                // We can handle this one-off case here
                while (!this.globalState.onV2HydrateRequiredObservable.hasObservers()) {
                    // eslint-disable-next-line
                    await new Promise((res) => setTimeout(res, 10));
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
        } catch (e: any) {
            Logger.Warn("Loading legacy snippet");
        }

        const guessed = this._guessLanguageFromCode(code); // "TS" | "JS"
        if (guessed !== this.globalState.language) {
            Utilities.SwitchLanguage(guessed, this.globalState, true);
        }
        // In this case we are loading a v1 playground snippet
        // And in all likelihood it didn't include export statements
        // Since that would not have run in the old playground
        // So we append to the end of the file to satisfy our module-based runner
        const fileName = guessed === "TS" ? "index.ts" : "index.js";
        code += `\nexport default ${guessed === "TS" ? "Playground" : (this._jsFunctions.find((fn) => code.includes(fn)) ?? "createScene")}\n`;
        if (guessed === "JS" && code.includes("createEngine")) {
            code += `\nexport { createEngine }\n`;
        }
        queueMicrotask(() => {
            this.globalState.onV2HydrateRequiredObservable.notifyObservers({
                v: ManifestVersion,
                files: { [fileName]: code },
                entry: fileName,
                imports: {},
                language: guessed,
            });
        });

        this.globalState.loadingCodeInProgress = false;
        this.globalState.onMetadataUpdatedObservable.notifyObservers();
    }

    private _loadPlayground(id: string) {
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
                    // eslint-disable-next-line
                    this._processJsonPayloadAsync(localRevision);
                    return;
                }
            }

            const xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = () => {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        // eslint-disable-next-line
                        this._processJsonPayloadAsync(xmlHttp.responseText);
                    }
                }
            };

            // defensive-handling a safari issue
            id.replace(/%23/g, "#");

            xmlHttp.open("GET", this.globalState.SnippetServerUrl + "/" + id.replace(/#/g, "/"));
            xmlHttp.send();
        } catch {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            this.globalState.loadingCodeInProgress = false;
            this.globalState.onCodeLoaded.notifyObservers("");
        }
    }
    private _guessLanguageFromCode(code: string): "TS" | "JS" {
        if (code.includes("class Playground")) {
            return "TS";
        }
        if (this._jsFunctions.some((fn) => code.includes(fn))) {
            return "JS";
        }
        if (!code) {
            return this.globalState.language as "TS" | "JS";
        }

        // Strong TS signals
        const tsSignals = [
            /\binterface\s+[A-Za-z_]\w*/m, // interface Foo
            /\benum\s+[A-Za-z_]\w*/m, // enum X
            /\btype\s+[A-Za-z_]\w*\s*=/m, // type T = ...
            /\bimplements\s+[A-Za-z_]/m, // class C implements X
            /\breadonly\b/m, // readonly
            /\bpublic\b|\bprivate\b|\bprotected\b/m, // visibility modifiers
            /\babstract\s+class\b/m, // abstract class
            /\bas\s+const\b/m, // as const
            /\bimport\s+type\s+/m, // import type { X }
        ];

        const hasTypeAnn = /[:]\s*[A-Za-z_$][\w$.<>,\s?\\[\]|&]*\b(?![:=])/m.test(code);

        if (tsSignals.some((r) => r.test(code)) || hasTypeAnn) {
            return "TS";
        }

        return "JS";
    }
}
