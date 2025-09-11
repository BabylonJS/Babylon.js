/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";
import { CompilationError } from "../components/errorDisplayComponent";
import { Observable, Logger } from "@dev/core";
import { debounce } from "ts-debounce";

import type { editor } from "monaco-editor/esm/vs/editor/editor.api";

/**
 *
 */
export class MonacoManager {
    private _editor: editor.IStandaloneCodeEditor;
    private _definitionWorker: Worker;
    private _models: Map<string, monaco.editor.ITextModel> = new Map();
    private _defProviderDisposable: monaco.IDisposable | null = null;
    private _viewStates: Map<string, monaco.editor.ICodeEditorViewState | null> = new Map();

    private _tagCandidates:
        | {
              /**
               *
               */
              name: string;
              /**
               *
               */
              tagName: string;
          }[]
        | undefined;
    private _hostElement: HTMLDivElement;
    private _templates: {
        /**
         *
         */
        label: string;
        /**
         *
         */
        key: string;
        /**
         *
         */
        documentation: string;
        /**
         *
         */
        insertText: string;
        /**
         *
         */
        language: string;
        /**
         *
         */
        kind: number;
        /**
         *
         */
        sortText: string;
        /**
         *
         */
        insertTextRules: number;
    }[] = [];

    private _isDirty = false;

    // --- Bare import stubs + type acquisition state ---
    private _bareImportStubDisposables: {
        /**
         *
         */
        ts?: monaco.IDisposable /**
         *
         */;
        js?: monaco.IDisposable;
    } = {};
    private _typeLibDisposables: monaco.IDisposable[] = [];
    private _importIndexCache = new WeakMap<monaco.editor.ITextModel, { version: number; items: any[] }>();
    private _acquiredSpecs = new Set<string>();
    private _failedSpecs = new Set<string>();
    private _pathsMap: Record<string, string[]> = {};
    private _tsBaseOpts: monaco.languages.typescript.CompilerOptions | null = null;
    private _jsBaseOpts: monaco.languages.typescript.CompilerOptions | null = null;

    public constructor(public globalState: GlobalState) {
        this._load(globalState);
    }

    // ---------------- Multi-file (V2) model management ----------------

    /**
     *
     * @param files
     * @param activePath
     * @param entryPath
     * @param imports
     */
    public setFiles(files: Record<string, string>, activePath: string, entryPath?: string, imports?: Record<string, string>) {
        const defaultEntry = this.globalState.language === "JS" ? "index.js" : "index.ts";
        const entry = entryPath || defaultEntry;
        if (!files[entry]) {
            files[entry] = this.globalState.language === "JS" ? "// Entry file\n" : "// Entry file\n";
        }
        if (!activePath) {
            activePath = entry;
        }

        // Dispose models not present anymore
        for (const [p, m] of this._models) {
            if (!files[p]) {
                m.dispose();
                this._models.delete(p);
            }
        }

        const fallbackLang = this.globalState.language === "JS" ? "javascript" : "typescript";
        // (Re)create models
        for (const [path, code] of Object.entries(files)) {
            const existing = this._models.get(path);
            if (existing) {
                if (existing.getValue() !== code) {
                    existing.setValue(code);
                }
            } else {
                const uri = monaco.Uri.file(path);
                const model = monaco.editor.createModel(code, MonacoLanguageForPathAndContent(path, fallbackLang), uri);
                model.onDidChangeContent(() => {
                    this.globalState.files[path] = model.getValue();
                    this._isDirty = true;
                });
                this._models.set(path, model);
            }
        }

        this.globalState.files = { ...files };
        if (imports) {
            this.globalState.importsMap = { ...imports };
        }
        this.globalState.entryFilePath = entry;
        this.globalState.activeFilePath = activePath;
        this.globalState.isMultiFile = true;

        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();

        if (this._editor) {
            const model = this._models.get(activePath) || [...this._models.values()][0];
            if (model) {
                this._editor.setModel(model);
                this._restoreViewStateFor(this.globalState.activeFilePath || activePath);
            }
        }

        // Ensure stubs / typings reflect the new file set
        this._installBareImportStubs();
    }

    /**
     *
     * @returns Current in-memory files (multi-file mode).
     */
    public getFiles(): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [p, m] of this._models) {
            out[p] = m.getValue();
        }
        return out;
    }

    private _saveViewStateFor(path: string) {
        if (!this._editor) {
            return;
        }
        const state = this._editor.saveViewState();
        this._viewStates.set(path, state);
    }

    private _restoreViewStateFor(path: string) {
        if (!this._editor) {
            return;
        }
        const state = this._viewStates.get(path);
        if (state) {
            this._editor.restoreViewState(state);
            // optional: ensure cursor/viewport is visible and focus the editor
            this._editor.focus();
        } else {
            // default if no saved state exists
            this._editor.setScrollTop(0);
        }
    }

    /**
     *
     * @param path Path of the file to switch to
     */
    public switchActiveFile(path: string) {
        if (!this._editor) {
            return;
        }

        // Save the current file’s view state before switching
        const prevPath = this.globalState.activeFilePath;
        if (prevPath) {
            this._saveViewStateFor(prevPath);
        }

        const model = this._models.get(path);
        if (!model) {
            return;
        }
        try {
            this._editor.setModel(model);
        } catch {}
        this.globalState.activeFilePath = path;

        // Restore the new file’s view state (scroll position, cursor, etc.)
        this._restoreViewStateFor(path);

        this.globalState.onActiveFileChangedObservable.notifyObservers();
    }

    /**
     *
     * @param path Path of the new file to add
     * @param initial
     */
    public addFile(path: string, initial = "") {
        // Auto-upgrade to multi-file if not already
        if (!this.globalState.isMultiFile) {
            const entry = this.globalState.entryFilePath || (this.globalState.language === "JS" ? "index.js" : "index.ts");
            if (!this._models.has(entry)) {
                const existingCode = this._editor?.getValue() || this.globalState.currentCode || initial;
                const uri = monaco.Uri.file(entry);
                const fallbackLang0 = this.globalState.language === "JS" ? "javascript" : "typescript";
                const model0 = monaco.editor.createModel(existingCode, MonacoLanguageForPathAndContent(entry, fallbackLang0), uri);
                model0.onDidChangeContent(() => {
                    this.globalState.files[entry] = model0.getValue();
                    this._isDirty = true;
                });
                this._models.set(entry, model0);
                this.globalState.files[entry] = existingCode;
                this.globalState.activeFilePath = entry;
                this.globalState.entryFilePath = entry;
            }
            this.globalState.isMultiFile = true;
        }
        if (this._models.has(path)) {
            return;
        }

        const fallbackLang = this.globalState.language === "JS" ? "javascript" : "typescript";
        const uri = monaco.Uri.file(path);
        const model = monaco.editor.createModel(initial, MonacoLanguageForPathAndContent(path, fallbackLang), uri);
        model.onDidChangeContent(() => {
            this.globalState.files[path] = model.getValue();
            this._isDirty = true;
        });
        this._models.set(path, model);
        this.globalState.files[path] = initial;
        this.switchActiveFile(path);
        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();
    }

    /**
     *
     * @param path Path of the file to remove
     */
    public removeFile(path: string) {
        const m = this._models.get(path);
        if (m) {
            m.dispose();
            this._models.delete(path);
        }
        this._viewStates.delete(path);
        delete this.globalState.files[path];

        const fallback = this.globalState.language === "JS" ? "index.js" : "index.ts";
        if (this.globalState.entryFilePath === path) {
            if (!this.globalState.files[fallback]) {
                this.addFile(fallback, "// Entry file\n");
            }
            this.globalState.entryFilePath = fallback;
        }
        if (!this.globalState.files[fallback]) {
            this.addFile(fallback, "// Entry file\n");
        }

        const next = Object.keys(this.globalState.files)[0] || fallback;
        this.switchActiveFile(next);
        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();
    }

    // ---------------- Boot / wiring ----------------

    private _load(globalState: GlobalState) {
        window.addEventListener("beforeunload", (evt) => {
            if (this._isDirty && Utilities.ReadBoolFromStore("safe-mode", false)) {
                const message = "Are you sure you want to leave. You have unsaved work.";
                evt.preventDefault();
                (evt as any).returnValue = message;
            }
        });

        globalState.onNewRequiredObservable.add(() => {
            if (Utilities.CheckSafeMode("Are you sure you want to create a new playground?")) {
                this._setNewContent();
                this._resetEditor(true);
            }
        });

        globalState.onInsertSnippetRequiredObservable.add((snippetKey: string) => {
            this._insertSnippet(snippetKey);
        });

        globalState.onClearRequiredObservable.add(() => {
            if (Utilities.CheckSafeMode("Are you sure you want to remove all your code?")) {
                this._editor?.setValue("");
                this._resetEditor();
            }
        });

        globalState.onNavigateRequiredObservable.add((position) => {
            this._editor?.revealPositionInCenter(position, monaco.editor.ScrollType.Smooth);
            this._editor?.setPosition(position);
        });

        globalState.onSavedObservable.add(() => {
            this._isDirty = false;
        });

        globalState.onCodeLoaded.add((code) => {
            if (!code) {
                this._setDefaultContent();
                this._installBareImportStubs();
                return;
            }
            if (this._editor) {
                this._editor.setValue(code);
                this._isDirty = false;
                this.globalState.onRunRequiredObservable.notifyObservers();
                this._installBareImportStubs();
            } else {
                this.globalState.currentCode = code;
                this._installBareImportStubs();
            }
        });

        globalState.onFormatCodeRequiredObservable.add(() => {
            this._editor?.getAction("editor.action.formatDocument")?.run();
        });

        globalState.onMinimapChangedObservable.add((value) => {
            this._editor?.updateOptions({ minimap: { enabled: value } });
        });

        globalState.onFontSizeChangedObservable.add(() => {
            this._editor?.updateOptions({ fontSize: parseInt(Utilities.ReadStringFromStore("font-size", "14")) });
        });

        globalState.onLanguageChangedObservable.add(async () => {
            await this.setupMonacoAsync(this._hostElement);
            this._installBareImportStubs();
        });

        globalState.onThemeChangedObservable.add(() => {
            this._createEditor();
        });

        // V2 hydrate
        this.globalState.onV2HydrateRequiredObservable.add(({ files, entry, imports, language }) => {
            if (language !== this.globalState.language) {
                Utilities.SwitchLanguage(language, this.globalState, true);
            }
            const first = entry && files[entry] ? entry : Object.keys(files)[0];
            this.setFiles(files, first, entry, imports);
        });

        // Keep stubs up-to-date when files change
        this.globalState.onFilesChangedObservable.add(() => this._installBareImportStubs());

        // PG connect (unchanged)
        const pgConnect = { onRequestCodeChangeObservable: new Observable() };
        pgConnect.onRequestCodeChangeObservable.add((options: any) => {
            let code = this._editor?.getValue() || "";
            code = code.replace(options.regex, options.replace);
            this._editor?.setValue(code);
        });
        (window as any).Playground = pgConnect;
    }

    // ---------------- Editor lifecycle ----------------

    private _setNewContent() {
        this._createEditor();
        this.globalState.currentSnippetToken = "";

        if (this.globalState.language === "JS") {
            this._editor?.setValue(`// You have to create a function called createScene. This function must return a BABYLON.Scene object
// You can reference the following variables: engine, canvas
// You must at least define a camera

var createScene = function() {
    var scene = new BABYLON.Scene(engine);

    //var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    return scene;
};`);
        } else {
            this._editor
                ?.setValue(`// You have to create a class called Playground. This class must provide a static function named CreateScene(engine, canvas) which must return a Scene object
// You must at least define a camera inside the CreateScene function

class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        var scene = new BABYLON.Scene(engine);

        //var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        return scene;
    }
}`);
        }

        this.globalState.onRunRequiredObservable.notifyObservers();
        if (location.pathname.indexOf("pg/") !== -1) {
            window.location.pathname = "";
        }
        this._installBareImportStubs();
    }

    private _indentCode(code: string, indentation: number): string {
        const indent = " ".repeat(indentation);
        return code
            .split("\n")
            .map((line) => indent + line)
            .join("\n");
    }

    private _getCode(key: string): string {
        let code = "";
        this._templates.forEach((item) => {
            if (item.key === key) {
                const regex = /\$\{[0-9]+:([^}]+)\}|\$\{[0-9]+\}/g;
                code = item.insertText.replace(regex, (_m, p1) => p1 || "");
            }
        });
        return code + "\n";
    }

    private _insertCodeAtCursor(code: string) {
        if (!this._editor) {
            return;
        }
        const position = this._editor.getPosition();
        if (!position) {
            return;
        }

        if (position.column && position.column > 1) {
            code = this._indentCode(code, position.column - 1).slice(position.column - 1);
        }
        this._editor.executeEdits("", [
            {
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: code,
                forceMoveMarkers: true,
            },
        ]);
    }

    private _insertSnippet(snippetKey: string) {
        const snippet = this._getCode(snippetKey);
        this._insertCodeAtCursor(snippet);
    }

    private _resetEditor(resetMetadata?: boolean) {
        location.hash = "";
        if (resetMetadata) {
            this.globalState.currentSnippetTitle = "";
            this.globalState.currentSnippetDescription = "";
            this.globalState.currentSnippetTags = "";
        }
        this._isDirty = true;
    }

    private _createEditor() {
        if (this._editor) {
            this._editor.dispose();
        }

        const editorOptions: editor.IStandaloneEditorConstructionOptions = {
            value: "",
            language: this.globalState.language === "JS" ? "javascript" : "typescript",
            lineNumbers: "on",
            roundedSelection: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            theme: Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "vs-dark" : "vs-light",
            contextmenu: false,
            folding: true,
            showFoldingControls: "always",
            fontSize: parseInt(Utilities.ReadStringFromStore("font-size", "14")),
            minimap: { enabled: Utilities.ReadBoolFromStore("minimap", true) },
            definitionLinkOpensInPeek: true,
            multiCursorModifier: "alt",
            gotoLocation: {
                multiple: "peek",
                multipleDefinitions: "peek",
                multipleDeclarations: "peek",
                multipleImplementations: "peek",
                multipleTypeDefinitions: "peek",
                multipleReferences: "peek",
            },
        };

        this._editor = monaco.editor.create(this._hostElement, editorOptions as any);
        this._editor.onDidScrollChange(() => {
            const p = this.globalState.activeFilePath;
            if (p) {
                this._viewStates.set(p, this._editor.saveViewState());
            }
        });
        if (this.globalState.isMultiFile && this.globalState.activeFilePath) {
            const model = this._models.get(this.globalState.activeFilePath);
            if (model) {
                this._editor.setModel(model);
                this._restoreViewStateFor(this.globalState.activeFilePath);
            }
        } else {
            // single-file: update diagnostics + stubs as you type
            const analyzeCodeDebounced = debounce(async () => await this._analyzeCodeAsync(), 500);
            const refreshStubs = debounce(() => this._installBareImportStubs(), 300);

            this._editor.onDidChangeModelContent(() => {
                const newCode = this._editor.getValue();
                if (this.globalState.currentCode !== newCode) {
                    this.globalState.currentCode = newCode;
                    this._isDirty = true;
                    analyzeCodeDebounced();
                    refreshStubs();
                }
            });
            if (this.globalState.currentCode) {
                this._editor.setValue(this.globalState.currentCode);
            }
        }

        this.globalState.getCompiledCode = async () => await this._getRunCodeAsync();

        if (this.globalState.currentCode) {
            this.globalState.onRunRequiredObservable.notifyObservers();
        }

        this._editor.onDidChangeModel(() => {
            const m = this._editor.getModel();
            if (!m) {
                return;
            }

            // Find our logical path for this URI
            let path: string | undefined;
            for (const [p, model] of this._models) {
                if (model.uri.toString() === m.uri.toString()) {
                    path = p;
                    break;
                }
            }
            if (!path) {
                return;
            }

            // Update GS and notify so the tab highlights correctly
            if (this.globalState.activeFilePath !== path) {
                this.globalState.activeFilePath = path;
                this.globalState.onActiveFileChangedObservable.notifyObservers();
            }
        });

        // After (re)creating editor, ensure stubs reflect current code
        this._installBareImportStubs();

        // Wire up cmd click override
        this._wireCmdClickOverride();
    }

    // ---------------- Monaco setup ----------------

    /**
     * Setup Monaco editor.
     * @param hostElement The HTML element to host the editor.
     * @param initialCall Whether this is the initial setup call.
     */
    public async setupMonacoAsync(hostElement: HTMLDivElement, initialCall = false) {
        this._hostElement = hostElement;

        const declarations = [
            "https://preview.babylonjs.com/babylon.d.ts",
            "https://preview.babylonjs.com/gui/babylon.gui.d.ts",
            "https://preview.babylonjs.com/loaders/babylonjs.loaders.d.ts",
            "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.d.ts",
            "https://preview.babylonjs.com/nodeEditor/babylon.nodeEditor.d.ts",
            "https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.d.ts",
            "https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.d.ts",
            "https://preview.babylonjs.com/serializers/babylonjs.serializers.d.ts",
            "https://preview.babylonjs.com/inspector/babylon.inspector.d.ts",
            "https://preview.babylonjs.com/accessibility/babylon.accessibility.d.ts",
            "https://preview.babylonjs.com/addons/babylonjs.addons.d.ts",
            "https://preview.babylonjs.com/glTF2Interface/babylon.glTF2Interface.d.ts",
            "https://assets.babylonjs.com/generated/Assets.d.ts",
        ];

        // snapshot/version/local overrides
        let snapshot = "";
        if (window.location.search.indexOf("snapshot=") !== -1) {
            snapshot = window.location.search.split("snapshot=")[1].split("&")[0];
            for (let i = 0; i < declarations.length; i++) {
                declarations[i] = declarations[i].replace("https://preview.babylonjs.com", "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot);
            }
        }

        let version = "";
        if (window.location.search.indexOf("version=") !== -1) {
            version = window.location.search.split("version=")[1].split("&")[0];
            for (let i = 0; i < declarations.length; i++) {
                declarations[i] = declarations[i].replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version);
            }
        }

        if (location.hostname === "localhost" && location.search.indexOf("dist") === -1) {
            for (let i = 0; i < declarations.length; i++) {
                declarations[i] = declarations[i].replace("https://preview.babylonjs.com/", "//localhost:1337/");
            }
        }

        if (location.href.indexOf("BabylonToolkit") !== -1 || Utilities.ReadBoolFromStore("babylon-toolkit", false) || Utilities.ReadBoolFromStore("babylon-toolkit-used", false)) {
            declarations.push("https://cdn.jsdelivr.net/gh/BabylonJS/BabylonToolkit@master/Runtime/babylon.toolkit.d.ts");
            declarations.push("https://cdn.jsdelivr.net/gh/BabylonJS/BabylonToolkit@master/Runtime/default.playground.d.ts");
        }

        const timestamp = (typeof globalThis !== "undefined" && (globalThis as any).__babylonSnapshotTimestamp__) || 0;
        if (timestamp) {
            for (let i = 0; i < declarations.length; i++) {
                if (declarations[i].indexOf("preview.babylonjs.com") !== -1) {
                    declarations[i] = declarations[i] + "?t=" + timestamp;
                }
            }
        }

        let libContent = "";
        const responses = await Promise.all(declarations.map(async (d) => await fetch(d)));
        const fallbackUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/refs/heads/master";
        for (const response of responses) {
            if (!response.ok) {
                const fallbackResponse = await fetch(response.url.replace("https://preview.babylonjs.com", fallbackUrl));
                if (fallbackResponse.ok) {
                    libContent += await fallbackResponse.text();
                } else {
                    Logger.Log(`missing declaration: ${response.url}`);
                }
            } else {
                libContent += await response.text();
            }
        }
        libContent += `
interface Window { engine: BABYLON.Engine; canvas: HTMLCanvasElement; }
declare var engine: BABYLON.Engine;
declare var canvas: HTMLCanvasElement;
        `;
        this._registerShaderLanguages();
        this._createEditor();
        this._installCrossModuleDefinitionProvider();
        this._setupDefinitionWorker(libContent);
        this._setupMonacoCompilationPipeline(libContent);
        this._setupMonacoColorProvider();

        // Keep stubs/typings aligned with the current code base
        this._installBareImportStubs();

        if (initialCall) {
            try {
                const templatesCodeUrl = "templates.json?uncacher=" + Date.now();
                this._templates = await (await fetch(templatesCodeUrl)).json();
                for (const template of this._templates) {
                    template.kind = monaco.languages.CompletionItemKind.Snippet;
                    template.sortText = "!" + template.label;
                    template.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                }
            } catch {
                Logger.Log("Error loading templates code");
            }
            this._hookMonacoCompletionProviderAsync();
        }

        if (!this.globalState.loadingCodeInProgress) {
            setTimeout(() => this._setDefaultContent(), 100);
        }
    }

    // ---------------- Rename ----------------

    public renameFile(oldPath: string, newPath: string) {
        const model = this._models.get(oldPath);
        if (!model) {
            return;
        }
        if (this._models.has(newPath)) {
            throw new Error("Target file already exists");
        }
        if (this._viewStates.has(oldPath)) {
            this._viewStates.set(newPath, this._viewStates.get(oldPath)!);
            this._viewStates.delete(oldPath);
        }
        const lang = model.getLanguageId();
        const value = model.getValue();
        const uri = monaco.Uri.file(newPath);
        const newModel = monaco.editor.createModel(value, lang, uri);
        newModel.onDidChangeContent(() => {
            this.globalState.files[newPath] = newModel.getValue();
        });
        this._models.set(newPath, newModel);
        this._models.delete(oldPath);
        model.dispose();
        delete this.globalState.files[oldPath];
        this.globalState.files[newPath] = value;
        if (this.globalState.activeFilePath === oldPath) {
            this.switchActiveFile(newPath);
        }
        if (this.globalState.entryFilePath === oldPath) {
            this.globalState.entryFilePath = newPath;
        }
        if (this.globalState.filesOrder?.length) {
            this.globalState.filesOrder = this.globalState.filesOrder.map((p) => (p === oldPath ? newPath : p));
            this.globalState.onFilesOrderChangedObservable?.notifyObservers();
        }
        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();
        this._installBareImportStubs();
    }

    // ---------------- Defaults ----------------

    private _setDefaultContent() {
        const entry = this.globalState.language === "JS" ? "index.js" : "index.ts";
        const defaultJs = `var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
    sphere.position.y = 1;
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
    return scene;
};`;
        const defaultTs = `class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        var scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
        sphere.position.y = 1;
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
        return scene;
    }
}
export { Playground };`;
        const defaultCode = this.globalState.language === "JS" ? defaultJs : defaultTs;

        this.globalState.isMultiFile = true;
        this.globalState.entryFilePath = entry;
        this.globalState.activeFilePath = entry;

        if (!this._models.has(entry)) {
            const fallbackLang = this.globalState.language === "JS" ? "javascript" : "typescript";
            const uri = monaco.Uri.file(entry);
            const model = monaco.editor.createModel(defaultCode, MonacoLanguageForPathAndContent(entry, fallbackLang), uri);
            model.onDidChangeContent(() => {
                this.globalState.files[entry] = model.getValue();
                this._isDirty = true;
            });
            this._models.set(entry, model);
            this.globalState.files[entry] = defaultCode;
            if (this._editor) {
                this._editor.setModel(model);
            }
        } else {
            const model = this._models.get(entry)!;
            if (!model.getValue()) {
                model.setValue(defaultCode);
            }
            this.switchActiveFile(entry);
        }

        if (!this.globalState.filesOrder || !this.globalState.filesOrder.length) {
            this.globalState.filesOrder = [entry];
            this.globalState.onFilesOrderChangedObservable?.notifyObservers();
        }
        this._isDirty = false;
        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();
        this.globalState.onRunRequiredObservable.notifyObservers();
        this._installBareImportStubs();
    }

    // ---------------- Color provider ----------------

    protected _setupMonacoColorProvider() {
        monaco.languages.registerColorProvider(this.globalState.language == "JS" ? "javascript" : "typescript", {
            provideColorPresentations: (_model: any, colorInfo: any) => {
                const c = colorInfo.color;
                const p = 100.0;
                const cvt = (n: number) => Math.round(n * p) / p;
                const label =
                    c.alpha === undefined || c.alpha === 1.0
                        ? `(${cvt(c.red)}, ${cvt(c.green)}, ${cvt(c.blue)})`
                        : `(${cvt(c.red)}, ${cvt(c.green)}, ${cvt(c.blue)}, ${cvt(c.alpha)})`;
                return [{ label }];
            },
            provideDocumentColors: (model: any) => {
                const digitGroup = "\\s*(\\d*(?:\\.\\d+)?)\\s*";
                const regex = `BABYLON\\.Color(?:3|4)\\s*\\(${digitGroup},${digitGroup},${digitGroup}(?:,${digitGroup})?\\)\\n{0}`;
                const matches = model.findMatches(regex, false, true, true, null, true);
                const num = (g: string) => (g === undefined ? undefined : Number(g));
                return matches.map((m: any) => ({
                    color: { red: num(m.matches![1])!, green: num(m.matches![2])!, blue: num(m.matches![3])!, alpha: num(m.matches![4])! },
                    range: {
                        startLineNumber: m.range.startLineNumber,
                        startColumn: m.range.startColumn + m.matches![0].indexOf("("),
                        endLineNumber: m.range.startLineNumber,
                        endColumn: m.range.endColumn,
                    },
                }));
            },
        });
    }

    // ---------------- TS/JS pipeline ----------------

    protected _setupMonacoCompilationPipeline(libContent: string) {
        const tsLang = monaco.languages.typescript;
        const shaderDts = `
declare module "*.wgsl" { const source: string; export default source; }
declare module "*.glsl" { const source: string; export default source; }
declare module "*.fx"   { const source: string; export default source; }
`;

        monaco.languages.typescript.typescriptDefaults.addExtraLib(shaderDts, "pg-shaders.d.ts");
        monaco.languages.typescript.javascriptDefaults.addExtraLib(shaderDts, "pg-shaders-js.d.ts");
        if (this.globalState.language === "JS") {
            const opts: monaco.languages.typescript.CompilerOptions = {
                allowJs: true,
                allowNonTsExtensions: true,
                checkJs: false,
                target: tsLang.ScriptTarget.ES2020,
                module: tsLang.ModuleKind.ESNext,
                moduleResolution: tsLang.ModuleResolutionKind.NodeJs,
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                allowArbitraryExtensions: true,
                experimentalDecorators: true,
                baseUrl: ".",
            };
            this._jsBaseOpts = opts;
            tsLang.javascriptDefaults.setCompilerOptions({ ...opts, paths: this._pathsMap });
            tsLang.javascriptDefaults.setEagerModelSync(true);
            tsLang.javascriptDefaults.addExtraLib(libContent, "babylon.d.ts");
        } else {
            const opts: monaco.languages.typescript.CompilerOptions = {
                target: tsLang.ScriptTarget.ES2020,
                module: tsLang.ModuleKind.ESNext,
                moduleResolution: tsLang.ModuleResolutionKind.NodeJs,
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                allowJs: true,
                resolveJsonModule: true,
                skipLibCheck: true,
                allowNonTsExtensions: true,
                noEmit: false,
                isolatedModules: true,
                strict: false,
                allowArbitraryExtensions: true,
                experimentalDecorators: true,
                emitDecoratorMetadata: false,
                baseUrl: ".",
            };
            this._tsBaseOpts = opts;
            tsLang.typescriptDefaults.setCompilerOptions({ ...opts, paths: this._pathsMap });
            tsLang.typescriptDefaults.setEagerModelSync(true);
            tsLang.typescriptDefaults.addExtraLib(libContent, "babylon.d.ts");
        }

        // Immediate pass to silence missing-module squiggles, then async ATA
        this._installBareImportStubs();
    }

    protected _setupDefinitionWorker(libContent: string) {
        this._definitionWorker = new Worker("workers/definitionWorker.js");
        this._definitionWorker.addEventListener("message", ({ data }) => {
            this._tagCandidates = data.result;
            this._analyzeCodeAsync();
        });
        this._definitionWorker.postMessage({ code: libContent });
    }

    private async _analyzeCodeAsync() {
        if (!this._editor || !this._tagCandidates) {
            return;
        }

        const model = this._editor.getModel();
        if (!model || model.isDisposed()) {
            return;
        }

        const uri = model.uri;
        const worker = this.globalState.language === "JS" ? await monaco.languages.typescript.getJavaScriptWorker() : await monaco.languages.typescript.getTypeScriptWorker();

        const languageService = await worker(uri);
        const source = "[preview]";
        monaco.editor.setModelMarkers(model, source, []);
        const markers: {
            /**
             *
             */
            startLineNumber: number;
            /**
             *
             */
            endLineNumber: number;
            /**
             *
             */
            startColumn: number;
            /**
             *
             */
            endColumn: number;
            /**
             *
             */
            message: string;
            /**
             *
             */
            severity: number;
            /**
             *
             */
            source: string;
        }[] = [];

        for (const candidate of this._tagCandidates) {
            if (model.isDisposed()) {
                continue;
            }
            const matches = model.findMatches(candidate.name, false, false, true, null, false);
            if (!matches) {
                continue;
            }

            for (const match of matches) {
                if (model.isDisposed()) {
                    continue;
                }
                const position = { lineNumber: match.range.startLineNumber, column: match.range.startColumn };
                const wordInfo = model.getWordAtPosition(position);
                const offset = model.getOffsetAt(position);
                if (!wordInfo) {
                    continue;
                }

                if (markers.find((m) => m.startLineNumber == position.lineNumber && m.startColumn == position.column)) {
                    continue;
                }

                const details = await languageService.getCompletionEntryDetails(uri.toString(), offset, wordInfo.word);
                if (!details || !details.tags) {
                    continue;
                }

                const tag = details.tags.find(
                    (t: {
                        /**
                         *
                         */
                        name: string;
                    }) => t.name === candidate.tagName
                );
                if (tag) {
                    markers.push({
                        startLineNumber: match.range.startLineNumber,
                        endLineNumber: match.range.endLineNumber,
                        startColumn: wordInfo.startColumn,
                        endColumn: wordInfo.endColumn,
                        message: this._getTagMessage(tag),
                        severity: this._getCandidateMarkerSeverity(candidate),
                        source,
                    });
                }
            }
        }

        monaco.editor.setModelMarkers(model, source, markers);
    }

    private _getCandidateMarkerSeverity(candidate: {
        /**
         *
         */
        tagName: string;
    }) {
        switch (candidate.tagName) {
            case "deprecated":
                return monaco.MarkerSeverity.Warning;
            default:
                return monaco.MarkerSeverity.Info;
        }
    }

    private _getCandidateCompletionSuffix(candidate: {
        /**
         *
         */
        tagName: string;
    }) {
        switch (candidate.tagName) {
            case "deprecated":
                return "⚠️";
            default:
                return "🧪";
        }
    }

    private _getTagMessage(tag: any) {
        if (tag?.text instanceof String) {
            if ((tag.text as string).indexOf("data:") === 0) {
                return `<img src="${tag.text}">`;
            }
            return tag.text;
        }
        if (tag?.text instanceof Array) {
            return tag.text
                .filter(
                    (i: {
                        /**
                         *
                         */
                        kind: string;
                    }) => i.kind === "text"
                )
                .map(
                    (i: {
                        /**
                         *
                         */
                        text: any;
                    }) => ((i.text as string).indexOf("data:") === 0 ? `<img src="${i.text}">` : i.text)
                )
                .join(", ");
        }
        return "";
    }

    private _completionDisposable: monaco.IDisposable | null = null;

    private _langId(): "javascript" | "typescript" {
        return this.globalState.language === "JS" ? "javascript" : "typescript";
    }

    private _getTsWorkerAsync = async (uri: monaco.Uri) => {
        if (this.globalState.language === "JS") {
            const getWorker = await monaco.languages.typescript.getJavaScriptWorker();
            return await getWorker(uri);
        } else {
            const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
            return await getWorker(uri);
        }
    };

    private _tsKindToMonaco(kind: string): monaco.languages.CompletionItemKind {
        switch (kind) {
            case "method":
                return monaco.languages.CompletionItemKind.Method;
            case "function":
                return monaco.languages.CompletionItemKind.Function;
            case "constructor":
                return monaco.languages.CompletionItemKind.Constructor;
            case "field":
                return monaco.languages.CompletionItemKind.Field;
            case "variable":
                return monaco.languages.CompletionItemKind.Variable;
            case "class":
                return monaco.languages.CompletionItemKind.Class;
            case "interface":
                return monaco.languages.CompletionItemKind.Interface;
            case "module":
                return monaco.languages.CompletionItemKind.Module;
            case "property":
                return monaco.languages.CompletionItemKind.Property;
            case "enum":
                return monaco.languages.CompletionItemKind.Enum;
            case "keyword":
                return monaco.languages.CompletionItemKind.Keyword;
            case "snippet":
                return monaco.languages.CompletionItemKind.Snippet;
            default:
                return monaco.languages.CompletionItemKind.Text;
        }
    }

    private _shouldDecorateLabel = (label: string) => {
        return this._tagCandidates?.some((t) => t.name === label) ?? false;
    };

    private _buildTemplates(language: "javascript" | "typescript") {
        const out: monaco.languages.CompletionItem[] = [];
        for (const t of this._templates) {
            if (t.language && t.language !== language) {
                continue;
            }
            out.push({
                label: t.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: t.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: t.documentation,
                sortText: t.sortText || "!" + t.label,
                range: undefined as any, // we’ll fill range later
            });
        }
        return out;
    }

    private async _hookMonacoCompletionProviderAsync() {
        this._completionDisposable?.dispose();
        const language = this._langId();
        this._completionDisposable = monaco.languages.registerCompletionItemProvider(language, {
            triggerCharacters: [".", '"', "'", "/", "@"],
            // eslint-disable-next-line
            provideCompletionItems: async (model, position, context, _token) => {
                const svc = await this._getTsWorkerAsync(model.uri);
                const offset = model.getOffsetAt(position);
                const info = await svc.getCompletionsAtPosition(model.uri.toString(), offset);

                const word = model.getWordUntilPosition(position);
                const replaceRange = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

                const suggestions: monaco.languages.CompletionItem[] = [];

                for (const e of info?.entries ?? []) {
                    if (e.name?.startsWith("_")) {
                        continue;
                    }

                    suggestions.push({
                        label: e.name,
                        kind: this._tsKindToMonaco(e.kind),
                        sortText: e.sortText ?? e.name,
                        filterText: e.insertText ?? e.name,
                        insertText: e.insertText ?? e.name,
                        range: replaceRange,
                        // @ts-expect-error custom fields
                        __uri: model.uri.toString(), // eslint-disable-line
                        __offset: offset, // eslint-disable-line
                        __source: e.source, // eslint-disable-line
                    });
                }

                if (context.triggerKind === monaco.languages.CompletionTriggerKind.Invoke) {
                    const templates = this._buildTemplates(language).map((t) => ({ ...t, range: replaceRange }));
                    suggestions.push(...templates);
                }

                const incomplete = !!info?.isIncomplete || (this._tagCandidates?.length ?? 0) === 0;

                return { suggestions, incomplete };
            },

            // eslint-disable-next-line
            resolveCompletionItem: async (item) => {
                try {
                    const uriStr = (item as any).__uri ?? monaco.editor.getModels()[0]?.uri.toString();

                    if (!uriStr) {
                        return item;
                    }

                    const svc = await this._getTsWorkerAsync(monaco.Uri.parse(uriStr));
                    let offset: number | undefined = (item as any).__offset;

                    if (offset == null && item.range) {
                        const m = monaco.editor.getModel(monaco.Uri.parse(uriStr));
                        if (m && typeof (item.range as any).startLineNumber === "number") {
                            const r = item.range as monaco.IRange;
                            offset = m.getOffsetAt(new monaco.Position(r.startLineNumber, r.startColumn));
                        }
                    }

                    if (offset == null) {
                        return item;
                    }

                    const labelStr = typeof item.label === "string" ? item.label : item.label.label;
                    if (!this._shouldDecorateLabel(labelStr)) {
                        return item;
                    }

                    const details = await svc.getCompletionEntryDetails(uriStr, offset, labelStr);

                    const candidate = this._tagCandidates?.find((t) => t.name === labelStr);
                    const hit = details?.tags?.find((t: any) => t.name === candidate?.tagName);
                    if (hit) {
                        item.label = labelStr + this._getCandidateCompletionSuffix(candidate!);
                    }
                } catch {
                    // ignore
                }
                return item;
            },
        });
    }

    private async _importAtPositionAsync(model: monaco.editor.ITextModel, position: monaco.Position) {
        const items = await this._indexImportsAsync(model);
        const pos = model.getOffsetAt(position);

        const hit = items.find((it: any) => pos >= it.ss && pos <= it.se);
        if (!hit) {
            return null;
        }

        const clickedBinding =
            hit.entries.find((e: any) => {
                const a = model.getOffsetAt(new monaco.Position(e.range.startLineNumber, e.range.startColumn));
                const b = model.getOffsetAt(new monaco.Position(e.range.endLineNumber, e.range.endColumn));
                return pos >= a && pos <= b;
            }) || null;

        const specA = model.getOffsetAt(new monaco.Position(hit.originSelectionRange.startLineNumber, hit.originSelectionRange.startColumn));
        const specB = model.getOffsetAt(new monaco.Position(hit.originSelectionRange.endLineNumber, hit.originSelectionRange.endColumn));
        const isOnSpec = pos >= specA && pos <= specB;

        return { ...hit, clickedBinding, isOnSpec };
    }

    // --- path helpers (class methods) ---
    private _stripQuery(s: string) {
        return s.replace(/\?.*$/, "");
    }

    private _pgToLocal(spec: string): string | null {
        const im = this.globalState.importsMap || {};
        if (im[spec]) {
            return im[spec];
        }
        const x = this._stripQuery(spec).replace(/^__pg__\//, "");
        if (this._models.has(x)) {
            return x;
        }
        const noDot = x.replace(/^\.\//, "");
        if (this._models.has(noDot)) {
            return noDot;
        }
        return null;
    }

    private _resolveRelative(fromPath: string, rel: string) {
        const base = fromPath.split("/");
        base.pop();
        for (const part of rel.split("/")) {
            if (!part || part === ".") {
                continue;
            }
            if (part === "..") {
                base.pop();
            } else {
                base.push(part);
            }
        }
        return base.join("/");
    }

    private _pickActual(p: string): string | null {
        if (this._models.has(p)) {
            return p;
        }
        for (const ext of [".ts", ".tsx", ".js", ".mjs"]) {
            if (this._models.has(p + ext)) {
                return p + ext;
            }
        }
        return null;
    }

    // --- find a specific export in a target model (class method) ---
    private _findExportRangeInTarget(targetModel: monaco.editor.ITextModel, targetPath: string, name: string, wantDefault: boolean): monaco.Range {
        const all = (re: RegExp) => targetModel.findMatches(re.source, false, true, false, null, true);
        const first = (rs: monaco.editor.FindMatch[]) => (rs && rs.length ? rs[0] : undefined);

        if (wantDefault) {
            const m = first(all(/\bexport\s+default\s+(?:abstract\s+)?(?:class|function)\s+[A-Za-z_$][\w$]*/)) || first(all(/\bexport\s+default\b/));
            if (m) {
                return m.range;
            }
        }

        {
            const m = first(all(new RegExp(String.raw`\bexport\s+(?:abstract\s+)?(?:class|function|const|let|var|type|interface)\s+${name}\b`)));
            if (m) {
                return m.range;
            }
        }

        {
            const m = first(all(new RegExp(String.raw`\bexport\s*\{[^}]*\b(?:${name}\b|(?:[A-Za-z_$][\w$]*)\s+as\s+${name}\b)[^}]*\}`)));
            if (m) {
                const text = targetModel.getValueInRange(m.range);
                const aliasRe = new RegExp(String.raw`([A-Za-z_$][\w$]*)\s+as\s+${name}\b`);
                const local = aliasRe.exec(text)?.[1] || name;

                const d =
                    first(all(new RegExp(String.raw`\bexport\s+(?:abstract\s+)?(?:class|function|const|let|var|type|interface)\s+${local}\b`))) ||
                    first(all(new RegExp(String.raw`\b(?:class|function|const|let|var|type|interface)\s+${local}\b`)));

                return (d || m).range;
            }
        }

        {
            const reListFrom = /\bexport\s*\{[^}]+\}\s*from\s*['"]([^'"]+)['"]/g;
            const matches = targetModel.findMatches(reListFrom.source, false, true, false, null, true);
            for (const mm of matches) {
                const text = targetModel.getValueInRange(mm.range);
                const list = /\{([\s\S]*?)\}/.exec(text)?.[1] || "";
                const spec = /from\s*['"]([^'"]+)['"]/.exec(text)?.[1] || "";

                for (const raw of list
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)) {
                    const parts = raw.split(/\s+as\s+/);
                    const orig = parts[0].trim();
                    const exported = (parts[1] || parts[0]).trim();

                    if (exported === name) {
                        const targetRaw =
                            spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") ? this._resolveRelative(targetPath, spec) : (this._pgToLocal(spec) ?? null);
                        const nextPath = targetRaw ? this._pickActual(targetRaw.replace(/\\/g, "/")) : null;

                        if (nextPath && this._models.has(nextPath)) {
                            const nextModel = this._models.get(nextPath)!;
                            const nextIsDefault = orig === "default";
                            return this._findExportRangeInTarget(nextModel, nextPath, nextIsDefault ? name : orig, nextIsDefault);
                        }
                        return mm.range;
                    }
                }
            }
        }

        {
            const star = targetModel.findMatches(String.raw`\bexport\s*\*\s*from\s*['"]([^'"]+)['"]`, false, true, false, null, true);
            for (const mm of star) {
                const spec = /from\s*['"]([^'"]+)['"]/.exec(targetModel.getValueInRange(mm.range))?.[1] || "";
                const targetRaw =
                    spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") ? this._resolveRelative(targetPath, spec) : (this._pgToLocal(spec) ?? null);
                const nextPath = targetRaw ? this._pickActual(targetRaw.replace(/\\/g, "/")) : null;

                if (nextPath && this._models.has(nextPath)) {
                    const nextModel = this._models.get(nextPath)!;
                    const r = this._findExportRangeInTarget(nextModel, nextPath, name, false);
                    if (r) {
                        return r;
                    }
                }
            }
        }

        const m = targetModel.findMatches(String.raw`\b${name}\b`, false, true, false, null, true)[0];
        return m ? m.range : new monaco.Range(1, 1, 1, 1);
    }

    private _wireCmdClickOverride() {
        let pendingNav: { targetPath: string; destRange: monaco.Range } | null = null;

        const deferNav = (fn: () => void) => setTimeout(() => requestAnimationFrame(() => setTimeout(fn, 0)), 0);

        this._editor.onMouseDown((e) => {
            if (!e.event.leftButton) {
                return;
            }
            const isCmd = e.event.metaKey || e.event.ctrlKey;
            if (!isCmd) {
                return;
            }

            const model = this._editor.getModel();
            const pos = e.target.position;
            if (!model || !pos) {
                return;
            }

            e.event.preventDefault?.();
            e.event.stopPropagation?.();

            (async () => {
                const hit = await this._importAtPositionAsync(model, pos);
                if (!hit) {
                    pendingNav = null;
                    return;
                }

                const { spec, entries, isNamespace, clickedBinding, isOnSpec } = hit;
                const isRelative = spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/");
                const isLocalMapped = !!this._pgToLocal(spec);
                // Peek if this is not a local import
                if (!isRelative && !isLocalMapped) {
                    pendingNav = null;
                    return;
                }

                const fromPath = model.uri.path.replace(/^[\\/]/, "").replace(/\\/g, "/");

                let targetPath: string | null;
                if (isRelative) {
                    targetPath = this._pickActual(this._resolveRelative(fromPath, spec));
                } else {
                    targetPath = this._pgToLocal(spec);
                    if (targetPath) {
                        targetPath = this._pickActual(targetPath) ?? targetPath;
                    }
                }
                if (!targetPath || !this._models.has(targetPath)) {
                    pendingNav = null;
                    return;
                }

                const targetModel = this._models.get(targetPath)!;

                let destRange: monaco.Range;
                if (isOnSpec || isNamespace || entries.length === 0) {
                    destRange = new monaco.Range(1, 1, 1, 1);
                } else {
                    const b = clickedBinding ?? entries[0];
                    destRange = this._findExportRangeInTarget(targetModel, targetPath, b.imported, b.isDefault);
                }

                pendingNav = { targetPath, destRange };
            })().catch(() => { // eslint-disable-line
                pendingNav = null;
            });
        });

        this._editor.onMouseUp((_e) => {
            if (!pendingNav) {
                return;
            }

            const { targetPath, destRange } = pendingNav;
            pendingNav = null;

            deferNav(async () => {
                if (!this._models.has(targetPath)) {
                    return;
                }
                this.switchActiveFile(targetPath);
                this._editor.revealRangeInCenter(destRange, monaco.editor.ScrollType.Smooth);
                this._editor.setPosition({ lineNumber: destRange.startLineNumber, column: destRange.startColumn });
                this._editor.focus();
            });
        });
    }

    private _installCrossModuleDefinitionProvider() {
        this._defProviderDisposable?.dispose();
        const lang = this._langId(); // 'javascript' | 'typescript'
        this._defProviderDisposable = monaco.languages.registerDefinitionProvider(lang, {
            // eslint-disable-next-line
            provideDefinition: async (model, position) => {
                const importHit = await this._importAtPositionAsync(model, position);
                if (!importHit) {
                    return undefined;
                }

                const { spec, entries, isNamespace, clickedBinding, isOnSpec } = importHit;

                const stripQuery = (s: string) => s.replace(/\?.*$/, "");
                const pgToLocal = (s: string): string | null => {
                    const im = this.globalState.importsMap || {};
                    if (im[s]) {
                        return im[s];
                    }
                    const x = stripQuery(s).replace(/^__pg__\//, "");
                    if (this._models.has(x)) {
                        return x;
                    }
                    const noDot = x.replace(/^\.\//, "");
                    if (this._models.has(noDot)) {
                        return noDot;
                    }
                    return null;
                };
                const resolveRelative = (fromPath: string, rel: string) => {
                    const base = fromPath.split("/");
                    base.pop();
                    for (const part of rel.split("/")) {
                        if (!part || part === ".") {
                            continue;
                        }
                        if (part === "..") {
                            base.pop();
                        } else {
                            base.push(part);
                        }
                    }
                    return base.join("/");
                };
                const pickActual = (p: string): string | null => {
                    if (this._models.has(p)) {
                        return p;
                    }
                    for (const ext of [".ts", ".tsx", ".js", ".mjs"]) {
                        if (this._models.has(p + ext)) {
                            return p + ext;
                        }
                    }
                    return null;
                };
                const fromPath = model.uri.path.replace(/^[\\/]/, "").replace(/\\/g, "/");
                let targetPath: string | null;
                if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/")) {
                    targetPath = this._pickActual(this._resolveRelative(fromPath, spec));
                } else {
                    targetPath = this._pgToLocal(spec);
                    if (targetPath) {
                        targetPath = this._pickActual(targetPath) ?? targetPath;
                    }
                }
                if (!targetPath || !this._models.has(targetPath)) {
                    return undefined;
                }

                const targetModel = this._models.get(targetPath)!;

                const findExportRangeInTarget = (targetModel: monaco.editor.ITextModel, targetPath: string, name: string, wantDefault: boolean): monaco.Range => {
                    const all = (re: RegExp) => targetModel.findMatches(re.source, false, true, false, null, true);
                    const first = (rs: monaco.editor.FindMatch[]) => (rs && rs.length ? rs[0] : undefined);

                    // 0) default export
                    if (wantDefault) {
                        // export default class|function Name ...
                        const m = first(all(/\bexport\s+default\s+(?:abstract\s+)?(?:class|function)\s+[A-Za-z_$][\w$]*/)) || first(all(/\bexport\s+default\b/));
                        if (m) {
                            return m.range;
                        }
                    }

                    // 1) direct named declarations
                    {
                        const m = first(all(new RegExp(String.raw`\bexport\s+(?:abstract\s+)?(?:class|function|const|let|var|type|interface)\s+${name}\b`)));
                        if (m) {
                            return m.range;
                        }
                    }

                    // 2) export list in same file: export { A, B as C }
                    {
                        const m = first(all(new RegExp(String.raw`\bexport\s*\{[^}]*\b(?:${name}\b|(?:[A-Za-z_$][\w$]*)\s+as\s+${name}\b)[^}]*\}`)));
                        if (m) {
                            // Try to jump to the local declaration (the left side of "as", or the same name)
                            const text = targetModel.getValueInRange(m.range);
                            const aliasRe = new RegExp(String.raw`([A-Za-z_$][\w$]*)\s+as\s+${name}\b`);
                            const local = aliasRe.exec(text)?.[1] || name;

                            const d =
                                first(all(new RegExp(String.raw`\bexport\s+(?:abstract\s+)?(?:class|function|const|let|var|type|interface)\s+${local}\b`))) ||
                                first(all(new RegExp(String.raw`\b(?:class|function|const|let|var|type|interface)\s+${local}\b`)));

                            return (d || m).range;
                        }
                    }

                    // 3) re-exports with list: export { X as Y } from './mod'
                    {
                        // find all "export { ... } from '...'"
                        const reListFrom = /\bexport\s*\{[^}]+\}\s*from\s*['"]([^'"]+)['"]/g;
                        const matches = targetModel.findMatches(reListFrom.source, false, true, false, null, true);
                        for (const mm of matches) {
                            const text = targetModel.getValueInRange(mm.range);
                            const list = /\{([\s\S]*?)\}/.exec(text)?.[1] || "";
                            const spec = /from\s*['"]([^'"]+)['"]/.exec(text)?.[1] || "";

                            // parse "A", "B as C" items
                            for (const raw of list
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)) {
                                const parts = raw.split(/\s+as\s+/);
                                const orig = parts[0].trim();
                                const exported = (parts[1] || parts[0]).trim();

                                if (exported === name) {
                                    // resolve next module and recurse
                                    const targetRaw =
                                        spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") ? resolveRelative(targetPath, spec) : (pgToLocal(spec) ?? null);
                                    const nextPath = targetRaw ? pickActual(targetRaw.replace(/\\/g, "/")) : null;

                                    if (nextPath && this._models.has(nextPath)) {
                                        const nextModel = this._models.get(nextPath)!;
                                        const nextIsDefault = orig === "default";
                                        return findExportRangeInTarget(nextModel, nextPath, nextIsDefault ? name : orig, nextIsDefault);
                                    }
                                    // couldn't resolve file — at least jump to this export
                                    return mm.range;
                                }
                            }
                        }
                    }

                    // 4) star re-exports: export * from './mod'
                    {
                        const star = targetModel.findMatches(String.raw`\bexport\s*\*\s*from\s*['"]([^'"]+)['"]`, false, true, false, null, true);
                        for (const mm of star) {
                            const spec = /from\s*['"]([^'"]+)['"]/.exec(targetModel.getValueInRange(mm.range))?.[1] || "";
                            const targetRaw =
                                spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") ? resolveRelative(targetPath, spec) : (pgToLocal(spec) ?? null);
                            const nextPath = targetRaw ? pickActual(targetRaw.replace(/\\/g, "/")) : null;

                            if (nextPath && this._models.has(nextPath)) {
                                const nextModel = this._models.get(nextPath)!;
                                const r = findExportRangeInTarget(nextModel, nextPath, name, false);
                                if (r) {
                                    return r;
                                }
                            }
                        }
                    }

                    // 5) last resort: first occurrence
                    const m = first(all(new RegExp(String.raw`\b${name}\b`)));
                    return m ? m.range : new monaco.Range(1, 1, 1, 1);
                };

                // If the click is on the quoted spec (or it's a namespace import),
                // jump to the file (single location) -> Monaco navigates (no peek)
                if (isOnSpec || isNamespace || entries.length === 0) {
                    const top = new monaco.Range(1, 1, 1, 1);
                    return [
                        {
                            uri: targetModel.uri,
                            range: top,
                        },
                    ];
                }

                // Clicked a specific binding -> jump right to that export
                const bindings = clickedBinding ? [clickedBinding] : entries;
                const locs = bindings.map((e: any) => {
                    const r = findExportRangeInTarget(targetModel, targetPath, e.imported, e.isDefault);
                    return { uri: targetModel.uri, range: r } as monaco.languages.Location;
                });
                return locs;
            },
        });
    }

    // global lexer
    // Load once, no dynamic import. Uses UMD build -> global esModuleLexer.
    private async _getModuleLexerAsync(): Promise<{ init: Promise<void>; parse: (code: string) => any[] }> {
        const g = globalThis as any;

        // If the bootstrap already put a module object here, just use it.
        if (g.__pg_v2_esmLexer) {
            return g.__pg_v2_esmLexer;
        }

        // If UMD already present (e.g. another part loaded it), use it.
        if (g.esModuleLexer) {
            await g.esModuleLexer.init;
            g.__pg_v2_esmLexer = g.esModuleLexer;
            return g.__pg_v2_esmLexer;
        }

        // Otherwise inject the UMD script.
        await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-loader="es-module-lexer"]');
            if (existing) {
                existing.addEventListener("load", () => resolve(), { once: true });
                existing.addEventListener("error", () => reject(new Error("es-module-lexer load error")), { once: true });
                return;
            }
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/es-module-lexer/dist/lexer.min.js";
            s.async = true;
            s.dataset.loader = "es-module-lexer";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("es-module-lexer load error"));
            document.head.appendChild(s);
        });

        const mod = (globalThis as any).esModuleLexer;
        await mod.init;
        (globalThis as any).__pg_v2_esmLexer = mod;
        return mod;
    }

    private async _indexImportsAsync(model: monaco.editor.ITextModel) {
        const version = model.getVersionId();
        const cached = this._importIndexCache.get(model);
        if (cached && cached.version === version) {
            return cached.items;
        }

        const { parse } = await this._getModuleLexerAsync();
        const code = model.getValue();
        const [imports] = parse(code);

        // Normalize to objects with statement + spec + binding ranges
        const items = imports.map((im: any) => {
            // Use normalized spec (string value) when available
            const spec: string = im.n ?? code.slice(im.s, im.e);

            // Robust statement start/end fallbacks
            const findStmtStart = (pos: number) => {
                // walk left to previous semicolon or line start
                for (let i = pos; i >= 0; i--) {
                    const ch = code.charCodeAt(i);
                    if (ch === 59 /* ; */) {
                        return i + 1;
                    }
                    if (ch === 10 /* \n */ || ch === 13 /* \r */) {
                        return i + 1;
                    }
                    // cheap guard: stop if we hit another "import" or "export" keyword boundary
                    if (i >= 5 && (code.slice(i - 6, i).endsWith("import") || code.slice(i - 6, i).endsWith("export"))) {
                        return i - 6;
                    }
                }
                return 0;
            };
            const findStmtEnd = (pos: number) => {
                // walk right to semicolon or line end
                for (let i = pos; i < code.length; i++) {
                    const ch = code.charCodeAt(i);
                    if (ch === 59 /* ; */) {
                        return i + 1;
                    }
                    if (ch === 10 /* \n */ || ch === 13 /* \r */) {
                        return i + 1;
                    }
                }
                return code.length;
            };

            const ss = typeof im.ss === "number" ? im.ss : findStmtStart(im.s);
            const se = typeof im.se === "number" ? im.se : findStmtEnd(im.e);

            const clauseStart = ss; // starts at statement start
            const clauseEnd = im.s; // right before the spec string
            const clause = code.slice(clauseStart, clauseEnd);

            type Entry = { imported: string; isDefault: boolean; range: monaco.IRange };
            const entries: Entry[] = [];

            // Default import
            const def = /^\s*import\s+([A-Za-z_$][\w$]*)\s*(?:,|from\b|$)/.exec(clause);
            if (def) {
                const local = def[1];
                const a = clauseStart + def.index + def[0].indexOf(local);
                const b = a + local.length;
                entries.push({
                    imported: "default",
                    isDefault: true,
                    range: new monaco.Range(model.getPositionAt(a).lineNumber, model.getPositionAt(a).column, model.getPositionAt(b).lineNumber, model.getPositionAt(b).column),
                });
            }

            // Namespace import
            const ns = /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(clause);
            const isNamespace = !!ns;

            // Named imports
            const named = /\{([\s\S]*?)\}/.exec(clause);
            if (named) {
                const inner = named[1];
                const innerStart = clauseStart + named.index! + 1;
                const partRe = /([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?/g;
                let m: RegExpExecArray | null;
                while ((m = partRe.exec(inner))) {
                    const exported = m[1];
                    const local = m[2] || m[1];
                    const a = innerStart + m.index + m[0].lastIndexOf(local);
                    const b = a + local.length;
                    entries.push({
                        imported: exported,
                        isDefault: false,
                        range: new monaco.Range(model.getPositionAt(a).lineNumber, model.getPositionAt(a).column, model.getPositionAt(b).lineNumber, model.getPositionAt(b).column),
                    });
                }
            }

            // spec selection range (no quotes when using im.n; still fine for hit testing)
            const originSelectionRange = new monaco.Range(
                model.getPositionAt(im.s).lineNumber,
                model.getPositionAt(im.s).column,
                model.getPositionAt(im.e).lineNumber,
                model.getPositionAt(im.e).column
            );

            return { ss, se, s: im.s, e: im.e, spec, clauseStart, clauseEnd, entries, isNamespace, originSelectionRange };
        });

        this._importIndexCache.set(model, { version, items });
        return items;
    }

    // ---------------- Bare import stubs + Automatic Type Acquisition ----------------

    private _collectAllSourceTexts(): string[] {
        if (this.globalState.isMultiFile) {
            return Object.values(this.globalState.files || {});
        }
        return [this._editor?.getValue() || this.globalState.currentCode || ""];
    }

    private _discoverBareImports(): Set<string> {
        // Matches: import ... from 'x'; export ... from 'x'; import('x'); import 'x';
        const importStmt = /(import\s+[^'";]*?['"]([^'"]+)['"][^;]*;?|export\s+[^;]*?from\s+['"]([^'"]+)['"];?|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"];)/g;

        const specs = new Set<string>();
        for (const code of this._collectAllSourceTexts()) {
            if (!code) {
                continue;
            }
            for (const m of code.matchAll(importStmt)) {
                const spec = (m[2] || m[3] || m[4] || m[5]) as string | undefined;
                if (!spec) {
                    continue;
                }
                if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") || spec.startsWith("__pg__/")) {
                    continue;
                }
                specs.add(spec.split(/[?#]/)[0]);
            }
        }
        return specs;
    }

    private _installBareImportStubs() {
        const specs = this._discoverBareImports();

        // dispose previous stubs
        this._bareImportStubDisposables.ts?.dispose?.();
        this._bareImportStubDisposables.js?.dispose?.();
        this._bareImportStubDisposables = {};

        if (!specs.size) {
            return;
        }

        // Generic any-typed modules to silence 2307 immediately
        let dts = "";
        for (const s of specs) {
            dts += `declare module "${s}" { const _m: any; export = _m; }\n`;
            dts += `declare module "${s}/*" { const _m: any; export = _m; }\n`;
        }

        const ts = monaco.languages.typescript;
        this._bareImportStubDisposables.ts = ts.typescriptDefaults.addExtraLib(dts, "pg-bare-imports.d.ts");
        this._bareImportStubDisposables.js = ts.javascriptDefaults.addExtraLib(dts, "pg-bare-imports-js.d.ts");

        // Try to fetch real typings (async)
        this._acquireTypingsForBareImportsAsync(specs);
    }

    private async _acquireTypingsForBareImportsAsync(specs: Set<string>) {
        for (const spec of specs) {
            if (this._acquiredSpecs.has(spec) || this._failedSpecs.has(spec)) {
                continue;
            }
            try {
                const ok = await this._acquireTypesForSpecAsync(spec);
                if (ok) {
                    this._acquiredSpecs.add(spec);
                } else {
                    this._failedSpecs.add(spec);
                }
            } catch {
                this._failedSpecs.add(spec);
            }
        }
    }

    private async _acquireTypesForSpecAsync(spec: string): Promise<boolean> {
        // 1) Try esm.sh ?dts (works for many packages, including bundled types)
        const cdn = (globalThis as any).__pg_v2_cdn?.toString() || "https://esm.sh/";
        const esmBase = cdn.includes("esm.sh") ? cdn.replace(/\/$/, "") : "https://esm.sh";
        const esmUrl = `${esmBase}/${spec}?dts`;

        try {
            const res = await fetch(esmUrl, { cache: "force-cache" });
            if (res.ok) {
                const text = await res.text();
                const vdir = `types/esm/${spec}`;
                const vfile = `${vdir}/index.d.ts`;
                this._registerTypingFile(vfile, text);
                this._addPathsFor(spec, vfile);
                this._addPathsFor(spec + "/*", vdir + "/*");
                return true;
            }
        } catch {
            // ignore
        }

        // 2) Fallback to DefinitelyTyped (@types/<pkg>)
        const pkg = spec.split("/")[0]; // 'lodash' from 'lodash/fp'
        const rootUrl = `https://cdn.jsdelivr.net/npm/@types/${pkg}`;
        try {
            const files = await this._fetchDtsTreeAsync(rootUrl, "index.d.ts");
            if (!files) {
                return false;
            }

            const base = `types/@types/${pkg}`;
            for (const [rel, txt] of files) {
                this._registerTypingFile(`${base}/${rel}`, txt);
            }

            this._addPathsFor(spec, `${base}/index.d.ts`);
            this._addPathsFor(spec + "/*", `${base}/*`);
            return true;
        } catch {
            return false;
        }
    }

    // Recursively fetch .d.ts graph from a base URL
    private async _fetchDtsTreeAsync(baseUrl: string, entryRel: string): Promise<Map<string, string> | null> {
        const out = new Map<string, string>();
        const queue = [entryRel];
        const seen = new Set<string>();
        const relImport = /(?:import|export)\s+(?:[^'"]*from\s+)?["'](\.\/[^"']+)["'];|\/\/\/\s*<reference\s+path=["']([^"']+)["']\s*\/>/g;

        while (queue.length) {
            const rel = queue.shift()!;
            if (seen.has(rel)) {
                continue;
            }
            seen.add(rel);

            const url = `${baseUrl}/${rel}`;
            const res = await fetch(url);
            if (!res.ok) {
                return null;
            }
            const text = await res.text();
            out.set(rel, text);

            for (const m of text.matchAll(relImport)) {
                const dep = (m[1] || m[2]) as string | undefined;
                if (!dep) {
                    continue;
                }
                let next = dep.endsWith(".d.ts") ? dep : `${dep}.d.ts`;
                next = next.replace(/^.\//, "");
                if (!seen.has(next)) {
                    queue.push(next);
                }
            }
        }
        return out;
        // Note: this is intentionally simple; complex packages may need additional mapping.
    }

    private _registerTypingFile(virtualPath: string, contents: string) {
        const lib = monaco.languages.typescript.typescriptDefaults.addExtraLib(contents, virtualPath);
        const libJs = monaco.languages.typescript.javascriptDefaults.addExtraLib(contents, virtualPath);
        this._typeLibDisposables.push(lib, libJs);
    }

    private _registerShaderLanguages() {
        const wgslId = "wgsl";
        const glslId = "glsl";

        const ensureLang = (id: string) => {
            try {
                monaco.languages.getLanguages().find((l) => l.id === id) || monaco.languages.register({ id });
            } catch {
                monaco.languages.register({ id });
            }
        };

        ensureLang(wgslId);
        ensureLang(glslId);

        const slashComments = [
            [/(\/\/.*$)/, "comment"],
            [/\/\*/, { token: "comment", next: "@comment" }],
        ];

        const numberRule = [/(\d+(\.\d+)?([eE][+-]?\d+)?[fF]?)/, "number"];
        const ident = /[A-Za-z_]\w*/;

        monaco.languages.setMonarchTokensProvider(wgslId, {
            defaultToken: "source",
            tokenizer: {
                root: [
                    ...slashComments,
                    numberRule,
                    [/(struct|var|let|const|override|fn|return|if|else|switch|case|default|break|continue|loop|for|while|discard|enable|requires|type|alias)\b/, "keyword"],
                    [/(true|false)/, "constant"],
                    [/(i32|u32|f32|f16|vec[234](?:i|u|f)?|mat[234]x[234]|ptr|array|texture\w*|sampler|bool)/, "type"],
                    [/@(binding|group|builtin|location|stage|vertex|fragment|compute|workgroup_size)/, "annotation"],
                    [ident, "identifier"],
                    [/"([^"\\]|\\.)*"?/, "string"],
                ] as any[],
                comment: [
                    [/[^/*]+/, "comment"],
                    [/\*\//, "comment", "@pop"],
                    [/./, "comment"],
                ],
            },
        });

        monaco.languages.setMonarchTokensProvider(glslId, {
            defaultToken: "source",
            tokenizer: {
                root: [
                    [/#\s*(version|define|undef|if|ifdef|ifndef|else|elif|endif|extension|pragma|line).*/, "meta"],
                    ...slashComments,
                    numberRule,
                    [
                        /(attribute|varying|uniform|buffer|layout|in|out|inout|const|struct|return|if|else|switch|case|default|break|continue|discard|while|for|do|precision|highp|mediump|lowp)\b/,
                        "keyword",
                    ],
                    [/(void|bool|int|uint|float|double|mat[234](?:x[234])?|vec[234]|ivec[234]|u?sampler\w*|image\w*)/, "type"],
                    [/(true|false)/, "constant"],
                    [ident, "identifier"],
                    [/"([^"\\]|\\.)*"?/, "string"],
                ] as any[],
                comment: [
                    [/[^/*]+/, "comment"],
                    [/\*\//, "comment", "@pop"],
                    [/./, "comment"],
                ],
            },
        });

        // Brackets & comments config
        const cfg: monaco.languages.LanguageConfiguration = {
            comments: { lineComment: "//", blockComment: ["/*", "*/"] },
            brackets: [
                ["{", "}"],
                ["[", "]"],
                ["(", ")"],
            ],
            autoClosingPairs: [
                { open: "{", close: "}" },
                { open: "[", close: "]" },
                { open: "(", close: ")" },
                { open: '"', close: '"' },
            ],
        };
        monaco.languages.setLanguageConfiguration(wgslId, cfg);
        monaco.languages.setLanguageConfiguration(glslId, cfg);

        // simple keyword completions
        const provideKw = (id: string, words: string[]) =>
            monaco.languages.registerCompletionItemProvider(id, {
                triggerCharacters: ["@", ".", "_"],
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position);
                    const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                    return {
                        suggestions: words.map((w) => ({
                            label: w,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: w,
                            range: range,
                        })),
                    };
                },
            });

        provideKw(wgslId, [
            "struct",
            "var",
            "let",
            "const",
            "override",
            "fn",
            "return",
            "if",
            "else",
            "switch",
            "case",
            "default",
            "break",
            "continue",
            "loop",
            "for",
            "while",
            "discard",
            "enable",
            "requires",
            "type",
            "alias",
            "true",
            "false",
            "@group",
            "@binding",
            "@builtin",
            "@location",
            "@stage",
            "@compute",
            "@fragment",
            "@vertex",
            "@workgroup_size",
        ]);

        provideKw(glslId, [
            "#version",
            "#define",
            "#ifdef",
            "#ifndef",
            "#if",
            "#else",
            "#elif",
            "#endif",
            "attribute",
            "varying",
            "uniform",
            "buffer",
            "layout",
            "in",
            "out",
            "inout",
            "const",
            "struct",
            "return",
            "if",
            "else",
            "switch",
            "case",
            "default",
            "break",
            "continue",
            "discard",
            "while",
            "for",
            "do",
            "precision",
            "highp",
            "mediump",
            "lowp",
            "true",
            "false",
        ]);
    }

    private _applyCompilerOptions() {
        const ts = monaco.languages.typescript;
        if (this._tsBaseOpts) {
            ts.typescriptDefaults.setCompilerOptions({ ...this._tsBaseOpts, paths: this._pathsMap });
        }
        if (this._jsBaseOpts) {
            ts.javascriptDefaults.setCompilerOptions({ ...this._jsBaseOpts, paths: this._pathsMap });
        }
    }

    private _addPathsFor(specOrGlob: string, target: string) {
        this._pathsMap[specOrGlob] = [target];
        this._applyCompilerOptions();
    }

    // ---------------- Build / run ----------------

    private async _getRunCodeAsync() {
        // If multi-file (V2), build JSON manifest and return iframe bootstrap.
        if (this.globalState.isMultiFile) {
            const files = this.getFiles();
            const entry = this.globalState.entryFilePath || (this.globalState.language === "JS" ? "index.js" : "index.ts");
            const manifest: any = { v: 2, language: this.globalState.language, entry, imports: this.globalState.importsMap || {}, files };
            return BuildV2Bootstrap(manifest);
        }

        if (this.globalState.language === "JS") {
            return this._editor.getValue();
        } else {
            const model = this._editor.getModel()!;
            const uri = model.uri;
            const worker = await monaco.languages.typescript.getTypeScriptWorker();
            const languageService = await worker(uri);

            const uriStr = uri.toString();
            const result = await languageService.getEmitOutput(uriStr);
            const diagnostics = await Promise.all([languageService.getSyntacticDiagnostics(uriStr), languageService.getSemanticDiagnostics(uriStr)]);

            diagnostics.forEach(function (diagset) {
                if (diagset.length) {
                    const diagnostic = diagset[0];
                    const position = model.getPositionAt(diagnostic.start!);
                    const err = new CompilationError();
                    err.message = diagnostic.messageText as string;
                    err.lineNumber = position.lineNumber;
                    err.columnNumber = position.column;
                    throw err;
                }
            });

            const output = result.outputFiles[0].text;
            const stub = "var createScene = function() { return Playground.CreateScene(engine, engine.getRenderingCanvas()); }";
            return output + stub;
        }
    }
}

// ---------------- helpers ----------------

function ExtFromPath(p: string) {
    const low = p.toLowerCase();
    if (low.endsWith(".ts") || low.endsWith(".tsx")) {
        return "ts";
    }
    if (low.endsWith(".js") || low.endsWith(".jsx")) {
        return "js";
    }
    if (low.endsWith(".wgsl")) {
        return "wgsl";
    }
    if (low.endsWith(".glsl")) {
        return "glsl";
    }
    if (low.endsWith(".fx")) {
        return "fx";
    }
    return "txt";
}

function DetectFxLangFromContent(text: string): "wgsl" | "glsl" {
    // Heuristics: WGSL has @group/@binding/@location, 'fn', 'let', 'var<storage>'
    // GLSL often has '#version', 'attribute/varying', 'precision', 'void main'
    const t = text || "";
    const isProbablyWGSL = /@group\(|@binding\(|@location\(|\bfn\b|\blet\b|\bvar\s*<|\btexture\w*\b|\bsampler\b/.test(t);
    const isProbablyGLSL = /#\s*version\b|\b(attribute|varying|precision)\b|\bvoid\s+main\s*\(/.test(t);
    if (isProbablyWGSL && !isProbablyGLSL) {
        return "wgsl";
    }
    if (isProbablyGLSL && !isProbablyWGSL) {
        return "glsl";
    }
    // Tie-break: default to WGSL (more modern in web contexts)
    return "wgsl";
}

function MonacoLanguageForPathAndContent(path: string, fallback: "javascript" | "typescript", content?: string) {
    const ext = ExtFromPath(path);
    if (ext === "ts") {
        return "typescript";
    }
    if (ext === "js") {
        return "javascript";
    }
    if (ext === "wgsl") {
        return "wgsl";
    }
    if (ext === "glsl") {
        return "glsl";
    }
    if (ext === "fx") {
        return DetectFxLangFromContent(content || "");
    }
    return fallback;
}

/**
 *
 * @param manifest The manifest object containing version, language, entry, imports, and files.
 * @returns
 */
function BuildV2Bootstrap(manifest: any): string {
    const metaJSON = JSON.stringify(manifest);

    return `/*PG_V2*/(function(){
/* Playground V2 ES Module Bootstrap with bare import resolution */
const META = ${metaJSON};
const RUN_NONCE = (globalThis.__pg_v2_nonce_inc = (globalThis.__pg_v2_nonce_inc||0)+1) + '-' + Date.now();

// Let host override CDN base if desired (e.g., 'https://cdn.jsdelivr.net/npm/')
const CDN_BASE = String(globalThis.__pg_v2_cdn || 'https://esm.sh/');

function cdnUrl(spec) {
  if (CDN_BASE.includes('esm.sh')) {
    return CDN_BASE.replace(/\\/$/, '') + '/' + spec;
  }
  if (CDN_BASE.includes('cdn.jsdelivr.net')) {
    return CDN_BASE.replace(/\\/$/, '') + '/' + spec + '/+esm';
  }
  return CDN_BASE.replace(/\\/$/, '') + '/' + spec;
}

// --- tiny helper: on-demand es-module-lexer ---
async function withModuleLexer() {
  if (globalThis.__pg_v2_esmLexer) return globalThis.__pg_v2_esmLexer;
  const mod = await import('https://cdn.jsdelivr.net/npm/es-module-lexer/+esm');
  await mod.init; // WASM init (no-op if already done)
  globalThis.__pg_v2_esmLexer = mod;
  return mod;
}

// Exposed to renderer: returns a (possibly promised) BABYLON.Scene
window.__pg_v2_run = async function(engine, canvas) {
  if (Array.isArray(globalThis.__pg_v2_blob_urls)) {
    for (const u of globalThis.__pg_v2_blob_urls) try { URL.revokeObjectURL(u); } catch {}
  }
  globalThis.__pg_v2_blob_urls = [];

  const needsTS = Object.keys(META.files).some(p => /[.]tsx?$/i.test(p));
  if (needsTS && !window.ts) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.min.js';
      s.onload = () => res(null);
      s.onerror = () => rej(new Error('Failed to load TypeScript'));
      document.head.appendChild(s);
    });
  }

  const ts = window.ts;
  const files = META.files;
  const entry = META.entry || (META.language === 'TS' ? 'index.ts' : 'index.js');
  globalThis.engine = engine;
  globalThis.canvas = canvas;

  // ---------- Import rewriting helpers ----------
  function resolveRelative(fromPath, rel) {
    const fromSeg = fromPath.split('/'); fromSeg.pop();
    const relSeg = rel.split('/');
    for (const part of relSeg) {
      if (part === '.' || part === '') continue;
      if (part === '..') { fromSeg.pop(); continue; }
      fromSeg.push(part);
    }
    return fromSeg.join('/');
  }
  const known = new Set(Object.keys(files));
  function pickActual(p) {
    if (known.has(p)) return p;
    if (known.has(p + '.ts')) return p + '.ts';
    if (known.has(p + '.tsx')) return p + '.tsx';
    if (known.has(p + '.js')) return p + '.js';
    if (known.has(p + '.mjs')) return p + '.mjs';
    return null;
  }

  const specKey = (p) => '__pg__/' + p + '?v=' + RUN_NONCE;

  function hasCreateSceneDecl(code) {
    const fnDecl = /\\bfunction\\s+createScene\\s*\\(/;
    const fnExpr = /\\b(?:var|let|const)\\s+createScene\\s*=\\s*(?:async\\s*)?function\\b/;
    const arrow  = /\\b(?:var|let|const)\\s+createScene\\s*=\\s*[^=]*=>/;
    return fnDecl.test(code) || fnExpr.test(code) || arrow.test(code);
  }

  // Lexer-based import rewriter (safe against strings/comments)
  async function rewriteImports(path, code) {
    const { parse } = await withModuleLexer();
    const [imports] = parse(code);
    if (!imports.length) return code;

    let out = '';
    let last = 0;
    for (const im of imports) {
      // im.n is the spec string for static imports/exports; undefined for non-static dynamic imports
      const spec = im.n;
      if (!spec) continue;
      const isRelative = spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/');
      let replacement = null;

      if (isRelative) {
        const targetRaw = resolveRelative(path, spec);
        const target = pickActual(targetRaw.replace(/\\\\/g, '/'));
        if (target) replacement = specKey(target);
      }

      // im.s..im.e are the exact indices of the specifier string (without surrounding code)
      out += code.slice(last, im.s) + (replacement ?? code.slice(im.s, im.e));
      last = im.e;
    }
    out += code.slice(last);
    return out;
  }

  function ensureExports(path, code) {
    if (path === entry) {
      const hasExportedCreate =
        /\\bexport\\s+function\\s+createScene\\b/.test(code) ||
        /\\bexport\\s*\\{[^}]*\\bcreateScene\\b[^}]*\\}/.test(code) ||
        /\\bexport\\s+default\\b/.test(code);

      if (hasCreateSceneDecl(code) && !hasExportedCreate) {
        code += ' export { createScene };';
      }

      const hasPlayground = /\\bclass\\s+Playground\\b/.test(code);
      const hasExportedPlayground =
        /\\bexport\\s+class\\s+Playground\\b/.test(code) ||
        /\\bexport\\s*\\{[^}]*\\bPlayground\\b[^}]*\\}/.test(code);

      if (hasPlayground && !hasExportedPlayground) {
        code += ' export { Playground };';
      }
    }
    return code;
  }

  // ---------- Phase 1: compile + rewrite relatives ----------
  const compiled = {};
  for (const [path, original] of Object.entries(files)) {
    // 1) Shader sources -> JS modules that default-export the raw text
    if (/[.](wgsl|glsl|fx)$/i.test(path)) {
        compiled[path] = \`export default \${JSON.stringify(original)};\`;
        continue;
    }

    // 2) Normal TS/JS flow
    let code = original;
    code = ensureExports(path, code);
    if (/[.]tsx?$/i.test(path) && ts) {
      try {
        code = ts.transpileModule(code, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2020,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: false,
          }
        }).outputText;
      } catch (e) {
        console.error('TS transpile failed for', path, e);
        throw e;
      }
    }
    code = await rewriteImports(path, code);
    compiled[path] = code;
  }

  // ---------- Phase 2: build import map ----------
  const imports = { ...(META.imports || {}) };

  // Map our compiled local modules
  for (const path of Object.keys(compiled)) {
    const spec = specKey(path);
    const blob = new Blob([compiled[path]], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    imports[spec] = url;
    (globalThis.__pg_v2_blob_urls || (globalThis.__pg_v2_blob_urls = [])).push(url);
  }

  // Detect bare imports with the lexer (robust)if 
  const bareSet = new Set();
  {
    const { parse } = await withModuleLexer();
    for (const code of Object.values(compiled)) {
      const [importsFound] = parse(code);
      for (const im of importsFound) {
        const spec = im.n;
        if (!spec) continue;                    // non-static dynamic import
        const looksLocal = spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/') || spec.startsWith(specKey(''));
        if (!looksLocal) bareSet.add(spec);
      }
    }
  }

  for (const spec of bareSet) {
    if (imports[spec]) continue; // user override wins
    imports[spec] = cdnUrl(spec);
    const prefixKey = spec.endsWith('/') ? spec : spec + '/';
    const prefixVal = cdnUrl(prefixKey);
    imports[prefixKey] = prefixVal.endsWith('/') ? prefixVal : (prefixVal + '/');
  }

  // Nice-to-have: support "npm:pkg" style specifiers
  if (!imports['npm:']) {
    imports['npm:'] = CDN_BASE.replace(/\\/$/, '/') ;
  }

  // Install/replace the import map
  const existing = document.getElementById('pg-v2-import-map');
  if (existing) existing.remove();
  const importMapEl = document.createElement('script');
  importMapEl.id = 'pg-v2-import-map';
  importMapEl.type = 'importmap';
  importMapEl.textContent = JSON.stringify({ imports });
  document.head.appendChild(importMapEl);

  // ---------- Phase 3: run entry ----------
  const entrySpec = specKey(entry);
  let mod;
  try {
    mod = await import(entrySpec);
  } catch (e) {
    console.error('Failed to import entry', entrySpec, e);
    throw e;
  }

  let createSceneFn = null;
  if (typeof mod.createScene === 'function') createSceneFn = mod.createScene;
  else if (typeof mod.default === 'function') createSceneFn = mod.default;
  else if (mod.Playground && typeof mod.Playground.CreateScene === 'function') createSceneFn = (e, c) => mod.Playground.CreateScene(e, c);
  else if (typeof globalThis.createScene === 'function') createSceneFn = globalThis.createScene;
  else if (globalThis.Playground && typeof globalThis.Playground.CreateScene === 'function') createSceneFn = (e, c) => globalThis.Playground.CreateScene(e, c);

  if (!createSceneFn) throw new Error('No createScene export (createScene / default / Playground.CreateScene) found in entry module.');

  const scene = await (createSceneFn(engine, canvas) ?? createSceneFn());
  return scene;
};
})();`;
}

window.addEventListener(
    "unhandledrejection",
    (ev: PromiseRejectionEvent) => {
        const r = ev.reason;
        if (r && (r.name === "Canceled" || r.message === "Canceled")) {
            ev.preventDefault(); // ignore Monaco cancellation noise
            ev.stopImmediatePropagation();
            ev.stopPropagation();
            return true;
        }
        return false;
    },
    { capture: true, passive: false, once: false }
);
