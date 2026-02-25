/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { GlobalState } from "../../globalState";
import { Utilities } from "../utilities";
import { Logger, Observable } from "@dev/core";
import { debounce } from "ts-debounce";
import { v5 as uuidv5 } from "uuid";

import { EditorHost } from "./editor/editorHost";
import { FilesManager } from "./files/filesManager";
import { TsPipeline } from "./ts/tsPipeline";
import { TypingsService } from "./typings/typingsService";
import { RegisterShaderLanguages } from "./language/shaderLanguages";
import { RegisterColorProvider } from "./language/colorProvider";
import { TemplatesService } from "./completion/templatesService";
import { CompletionService } from "./completion/completionService";
import { CodeAnalysisService } from "./analysis/codeAnalysisService";
import { DefinitionService } from "./navigation/definitionService";
import type { V2RunnerOptions } from "./run/runner";
import type { SnippetData } from "../snippet";
import { ManifestVersion, type V2Manifest } from "../snippet";
import { CreateV2Runner } from "./run/runner";
import { CompilationError } from "../../components/errorDisplayComponent";
import { ParseSpec } from "./typings/utils";
import { CodeLensService } from "./codeLens/codeLensProvider";
import type { RequestLocalResolve } from "./typings/types";
import { WriteLastLocal, ReadLastLocal } from "../localSession";

interface IRunConfig {
    manifest: V2Manifest;
    options: V2RunnerOptions;
}

const NamespaceUUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
/**
 *
 */
export class MonacoManager {
    private _editorHost = new EditorHost();
    private _files = new FilesManager(() => (this.globalState.language === "JS" ? "javascript" : "typescript"));
    private _tsPipeline = new TsPipeline();
    private _typings = new TypingsService(
        (spec, target) => this._tsPipeline.addPathsFor(spec, target),
        (resolveInfo) => this._onRequestLocalResolve(resolveInfo)
    );
    private _templates = new TemplatesService();
    private _completions = new CompletionService();
    private _codeAnalysis = new CodeAnalysisService();
    private _definitions = new DefinitionService(this._files, (path) => this.switchActiveFile(path));
    private _codeLens = new CodeLensService(async (fullSpec) => await this._resolveOneLocalAsync(fullSpec));

    private _hostElement!: HTMLDivElement;
    private _lastRunConfig: IRunConfig | null = null;
    private _lastRunConfigHash: string | null = null;

    private _hydrating = false;
    private _initialized = false;
    private _skipOnceLocal = false;

    private _localPkgHandles = new Map<string, FileSystemDirectoryHandle>();
    private _localPkgIntervals = new Map<string, NodeJS.Timeout>();

    public constructor(public globalState: GlobalState) {
        window.addEventListener("beforeunload", (evt) => {
            if (this._files.isDirty && Utilities.ReadBoolFromStore("safe-mode", false)) {
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

        globalState.onClearRequiredObservable.add(() => {
            if (Utilities.CheckSafeMode("Are you sure you want to remove all your code?")) {
                this._editorHost.editor?.setValue("");
                this._resetEditor();
            }
        });

        globalState.onInsertSnippetRequiredObservable.add((snippetKey) => {
            this.insertSnippet(snippetKey);
        });

        globalState.onNavigateRequiredObservable.add((position) => {
            this._editorHost.editor?.revealPositionInCenter(position, monaco.editor.ScrollType.Smooth);
            this._editorHost.editor?.setPosition(position);
        });

        globalState.onRunExecutedObservable.add(() => {
            // ATA should complete before run, not after - this call is redundant
            // this._syncBareImportStubsAsync();
        });

        globalState.onSavedObservable.add(() => {
            this._files.setDirty(false);
        });

        globalState.onCodeLoaded.add((code) => {
            if (!code) {
                this._setDefaultContent();
                this._syncBareImportStubsAsync();
                return;
            }
            if (this._editorHost.editor) {
                this._editorHost.editor.setValue(code);
                this._files.setDirty(false);
                this.globalState.onRunRequiredObservable.notifyObservers();
                this._syncBareImportStubsAsync();
            } else {
                this.globalState.currentCode = code;
                this._syncBareImportStubsAsync();
            }
        });

        globalState.onFormatCodeRequiredObservable.add(() => {
            this._editorHost.editor?.getAction("editor.action.formatDocument")?.run();
        });

        globalState.onMinimapChangedObservable.add((value) => {
            this._editorHost.editor?.updateOptions({ minimap: { enabled: value } as any });
        });

        globalState.onFontSizeChangedObservable.add(() => {
            this._editorHost.editor?.updateOptions({ fontSize: parseInt(Utilities.ReadStringFromStore("font-size", "14")) } as any);
        });

        globalState.onLanguageChangedObservable.add(async () => {
            this._setNewContent();
            this._syncBareImportStubsAsync();
            this.invalidateRunnerCache();
            globalState.onFilesChangedObservable.notifyObservers();
        });

        globalState.onThemeChangedObservable.add(() => {
            const theme = Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "vs-dark" : "vs-light";
            (this.editorHost.editor as any)._themeService.setTheme(theme);
        });

        // V2 hydrate
        this.globalState.onV2HydrateRequiredObservable.add(async ({ files, entry, imports, language }) => {
            this._hydrating = true;
            while (!this._initialized) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (language !== this.globalState.language) {
                Utilities.SwitchLanguage(language, this.globalState, true);
            }
            const first = entry && files[entry] ? entry : Object.keys(files)[0];
            this.setFiles(files, first, entry, imports);

            this._initializeFileState(first);

            // Force sync models after all files are loaded to avoid race conditions
            this._tsPipeline.forceSyncModels();

            // Sync ATA after hydration to ensure types are loaded
            await this._syncBareImportStubsAsync();

            globalState.onRunRequiredObservable.notifyObservers();
            this._hydrating = false;

            const lastLocalJson = ReadLastLocal(this.globalState);
            if (lastLocalJson) {
                try {
                    const lastLocal = JSON.parse(lastLocalJson) as SnippetData;
                    if (lastLocal.sessionData) {
                        const validFiles = new Set(Object.keys(this.globalState.files ?? {}));
                        const filteredOpenFiles = lastLocal.sessionData.openFiles.filter((f) => validFiles.has(f));
                        if (filteredOpenFiles.length > 0) {
                            this.globalState.openEditors = filteredOpenFiles;
                            this.globalState.onOpenEditorsChangedObservable?.notifyObservers();
                        }
                        if (lastLocal.sessionData.activeFile && validFiles.has(lastLocal.sessionData.activeFile)) {
                            this.switchActiveFile(lastLocal.sessionData.activeFile);
                            this.editorHost.editor?.setPosition(lastLocal.sessionData.cursorPosition);
                            this.editorHost.editor?.focus();
                            this.editorHost.editor?.revealPositionInCenter(lastLocal.sessionData.cursorPosition);
                        }
                    }
                } catch {}
            }
        });

        this.globalState.onFilesChangedObservable.add(() => {
            // Prevent worker restart during hydration to avoid race conditions
            if (!this._hydrating) {
                this._tsPipeline.forceSyncModels();
            }
            this._tsPipeline.addWorkspaceFileDeclarations(this.globalState.files || {});
            this.invalidateRunnerCache();
        });

        const pgConnect = { onRequestCodeChangeObservable: new Observable() };
        pgConnect.onRequestCodeChangeObservable.add((options: any) => {
            let code = this._editorHost.editor?.getValue() || "";
            code = code.replace(options.regex, options.replace);
            this._editorHost.editor?.setValue(code);
        });
        (window as any).Playground = pgConnect;

        // Initialize getRunnable as a bound method
        this.globalState.getRunnable = this.getRunnableAsync.bind(this);
    }

    private _initializeFileState(entry: string) {
        this.globalState.openEditors = [entry];
        this.globalState.activeEditorPath = entry;
        this.globalState.onOpenEditorsChangedObservable?.notifyObservers();
        this.globalState.onActiveEditorChangedObservable?.notifyObservers();
    }
    public setFiles(files: Record<string, string>, activePath: string, entryPath?: string, imports?: Record<string, string>) {
        const defaultEntry = this.globalState.language === "JS" ? "index.js" : "index.ts";
        const entry = entryPath || defaultEntry;
        if (!files[entry]) {
            files[entry] = this.globalState.language === "JS" ? "// Entry file\n" : "// Entry file\n";
        }
        if (!activePath) {
            activePath = entry;
        }

        this._files.setFiles(files, (p, code) => {
            this.globalState.files[p] = code;
            this._files.setDirty(true);
        });
        this.globalState.files = { ...files };
        if (imports) {
            this.globalState.importsMap = { ...imports };
        }
        this.globalState.entryFilePath = entry;
        this.globalState.activeFilePath = activePath;

        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();

        if (this._editorHost.editor) {
            const model = this._files.getModel(activePath) || (monaco.editor.getModels()[0] ?? null);
            if (model) {
                this._editorHost.editor.setModel(model);
                this._files.restoreViewState(activePath, this._editorHost.editor);
            }
        }
        this._syncBareImportStubsAsync();
    }

    public getFiles() {
        return this._files.getFiles();
    }

    public switchActiveFile(path: string) {
        const editor = this._editorHost.editor as monaco.editor.IStandaloneCodeEditor;
        if (!editor) {
            return;
        }
        const prev = this.globalState.activeFilePath;
        if (prev) {
            this._files.saveViewState(prev, editor.saveViewState());
        }
        const model = this._files.getModel(path);
        if (!model) {
            return;
        }
        editor.setModel(model);
        this.globalState.activeFilePath = path;
        this._files.restoreViewState(path, editor);
        this.globalState.onActiveFileChangedObservable.notifyObservers();
    }

    public addFile(path: string, initial = "") {
        if (this._files.has(path)) {
            return;
        }

        this._files.addFile(path, initial, (p, code) => {
            this.globalState.files[p] = code;
            this._files.setDirty(true);
        });
        this.globalState.files[path] = initial;
        this.switchActiveFile(path);
        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();
    }

    public removeFile(path: string) {
        this._files.removeFile(path);
        delete this.globalState.files[path];

        const next = Object.keys(this.globalState.files)[0];
        this.switchActiveFile(next);
        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();
    }

    public renameFile(oldPath: string, newPath: string) {
        const success = this._files.renameFile(oldPath, newPath, (p, code) => {
            this.globalState.files[p] = code;
            this._files.setDirty(true);
        });

        if (success) {
            const content = this.globalState.files[oldPath];
            delete this.globalState.files[oldPath];
            this.globalState.files[newPath] = content;

            if (this.globalState.entryFilePath === oldPath) {
                this.globalState.entryFilePath = newPath;
            }

            if (this.globalState.activeFilePath === oldPath) {
                this.globalState.activeFilePath = newPath;
            }

            this.globalState.onFilesChangedObservable.notifyObservers();
            this.globalState.onManifestChangedObservable.notifyObservers();
            this.globalState.onActiveFileChangedObservable.notifyObservers();

            this._syncBareImportStubsAsync();
        }

        return success;
    }

    /**
     * Create a configuration hash for caching runners
     * @param config The run configuration to hash
     * @returns A hash string representing the configuration
     */
    private _createConfigHash(config: IRunConfig): string {
        const manifestStr = JSON.stringify(config.manifest);
        const optionsStr = JSON.stringify({
            monaco: !!config.options.monaco,
            createModelsIfMissing: config.options.createModelsIfMissing,
            importMapId: config.options.importMapId,
            runtime: config.options.runtime,
        });
        return uuidv5(manifestStr + optionsStr, NamespaceUUID);
    }

    public get manifest(): V2Manifest {
        const entry = this.globalState.entryFilePath || (this.globalState.language === "JS" ? "index.js" : "index.ts");
        const files = this._files.getFiles();
        const imports = this.globalState.importsMap || {};
        return {
            v: ManifestVersion,
            language: this.globalState.language as "JS" | "TS",
            entry,
            imports,
            files,
        };
    }

    /**
     * Get or create a V2 runner with caching based on configuration
     * @returns Promise that resolves to a V2Runner instance
     */
    public async getRunnableAsync() {
        const manifest = this.manifest;

        const options: V2RunnerOptions = {
            monaco,
            createModelsIfMissing: true,
            importMapId: "pg-v2-import-map",
            skipDiagnostics: this._hydrating, // Skip diagnostics during hydration to avoid timeouts
            onDiagnosticError: ({ path, message, line, column }) => {
                const err = new CompilationError();
                err.message = `${path}:${line}:${column} ${message}`;
                err.lineNumber = line;
                err.columnNumber = column;
                this.globalState.onErrorObservable.notifyObservers(err);
            },
        };

        const config: IRunConfig = { manifest, options };
        const configHash = this._createConfigHash(config);

        // Check if we can reuse the existing runner
        if (this._lastRunConfig && this._lastRunConfigHash === configHash && this.globalState.currentRunner && this._isConfigurationEquivalent(this._lastRunConfig, config)) {
            return this.globalState.currentRunner;
        }

        // Wait for any ongoing ATA operations before creating runner
        if (this._typings.isAtaInFlight) {
            Logger.Log("ATA is in flight, waiting for completion before creating runner...");
            const ataCompleted = await this._typings.waitForAtaCompletionAsync(1500);
            if (!ataCompleted) {
                Logger.Warn("ATA did not complete within timeout, proceeding with runner creation anyway");
            } else {
                Logger.Log("ATA completed, proceeding with runner creation");
            }
        }

        // Dispose the previous runner if it exists
        try {
            this.globalState.currentRunner?.dispose?.();
        } catch {}

        // Create new runner and cache the configuration
        this.globalState.currentRunner = await CreateV2Runner(manifest, options, this._tsPipeline);
        this._lastRunConfig = config;
        this._lastRunConfigHash = configHash;

        return this.globalState.currentRunner;
    }

    /**
     * Check if two configurations are equivalent for caching purposes
     * @param config1 First configuration to compare
     * @param config2 Second configuration to compare
     * @returns true if configurations are equivalent
     */
    private _isConfigurationEquivalent(config1: IRunConfig, config2: IRunConfig): boolean {
        // Compare manifests deeply
        if (config1.manifest.language !== config2.manifest.language || config1.manifest.entry !== config2.manifest.entry) {
            return false;
        }

        // Compare file contents
        const files1Keys = Object.keys(config1.manifest.files).sort();
        const files2Keys = Object.keys(config2.manifest.files).sort();

        if (files1Keys.length !== files2Keys.length) {
            return false;
        }

        for (let i = 0; i < files1Keys.length; i++) {
            const key = files1Keys[i];
            if (key !== files2Keys[i] || config1.manifest.files[key] !== config2.manifest.files[key]) {
                return false;
            }
        }

        // Compare imports
        const imports1 = JSON.stringify(config1.manifest.imports || {});
        const imports2 = JSON.stringify(config2.manifest.imports || {});

        return imports1 === imports2;
    }

    /**
     * Invalidate the runner cache (call when files or configuration changes)
     */
    public invalidateRunnerCache(): void {
        this._lastRunConfig = null;
        this._lastRunConfigHash = null;
    }

    private _createEditor() {
        const lang = this.globalState.language === "JS" ? "javascript" : "typescript";
        if (!this._hostElement) {
            return;
        }
        this._editorHost.create(this._hostElement, lang);

        // Key binding to run the PG code - ctrl/cmd + enter
        this._editorHost.editor.addAction({
            id: "pg.run",
            label: "Run",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            // eslint-disable-next-line
            run: () => {
                this.globalState.onRunRequiredObservable.notifyObservers();
            },
        });

        const analyzeCodeDebounced = debounce(async () => {
            const model = this._editorHost.editor.getModel();
            if (model) {
                await this._codeAnalysis.analyzeCodeAsync(model, this.globalState);
            }
        }, 500);
        const refreshStubsDebounced = debounce(async () => await this._syncBareImportStubsAsync(), 300);
        const serializeSessionDebounced = debounce(() => {
            const positionJson = this._editorHost?.editor?.getPosition()?.toJSON();
            WriteLastLocal(this.globalState, {
                includeSessionData: true,
                lastCursorPosition: positionJson ? positionJson : { lineNumber: 0, column: 0 },
            });
        }, 500);

        this._editorHost.editor.onDidChangeModelContent(() => {
            const newCode = this._editorHost.editor.getValue();
            if (this.globalState.currentCode !== newCode) {
                this.globalState.currentCode = newCode;
                this._files.setDirty(true);
                analyzeCodeDebounced();
                refreshStubsDebounced();

                // After any user input we can serialize the snippet's session state
                // Important this only is triggered when these are real user inputs and not from PG load itself
                // But if we just hydrated from a local session, don't immediately overwrite it
                if (this.globalState.currentSnippetRevision === "local" && !this._skipOnceLocal) {
                    this._skipOnceLocal = true;
                    return;
                }
                serializeSessionDebounced();
            }
        });
        if (this.globalState.currentCode) {
            this._editorHost.editor.setValue(this.globalState.currentCode);
        }

        if (this.globalState.currentCode) {
            this.globalState.onRunRequiredObservable.notifyObservers();
        }

        this._editorHost.editor.onDidChangeModel(() => {
            const m = this._editorHost.editor.getModel();
            if (!m) {
                return;
            }
            let path: string | undefined;
            for (const p of this._files.paths()) {
                const model = this._files.getModel(p)!;
                if (model.uri.toString() === m.uri.toString()) {
                    path = p;
                    break;
                }
            }
            if (!path) {
                return;
            }
            if (this.globalState.activeFilePath !== path) {
                this.globalState.activeFilePath = path;
                this.globalState.onActiveFileChangedObservable.notifyObservers();
            }
        });

        this._syncBareImportStubsAsync();
    }

    public async setupMonacoAsync(hostElement: HTMLDivElement) {
        this._hostElement = hostElement;

        // Register shader languages
        RegisterShaderLanguages();

        // Register color providers
        RegisterColorProvider("javascript");
        RegisterColorProvider("typescript");

        // Load templates
        await this._templates.loadAsync();

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

        this._tsPipeline.setup(libContent);

        // Register completion provider
        this._completions.register(this.globalState.language as "JS" | "TS", this._templates.templates);

        // Register code lens
        this._codeLens.register(this.globalState.language as "JS" | "TS");

        // Install definition provider
        this._definitions.installProvider();

        // Force sync models for better import recognition
        this._tsPipeline.forceSyncModels();

        this._createEditor();
        await this._syncBareImportStubsAsync();
        await this.typingsService.waitForAtaCompletionAsync();

        if (!this.globalState.loadingCodeInProgress && !this._hydrating) {
            setTimeout(() => this._setDefaultContent(), 100);
        }
        this._initialized = true;
    }

    // ---------------- Defaults ----------------
    private _setDefaultContent() {
        const entry = this.globalState.language === "JS" ? "index.js" : "index.ts";
        const defaultJs = `export const createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape.
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

    return scene;
};`;
        const defaultTs = `class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new BABYLON.Scene(engine);

        // This creates and positions a free camera (non-mesh)
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape.
        var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape.
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

        return scene;
    }
}
export { Playground };`;
        const defaultCode = this.globalState.language === "JS" ? defaultJs : defaultTs;

        this.globalState.entryFilePath = entry;
        this.globalState.activeFilePath = entry;
        this.globalState.openEditors = [entry];

        if (!this._files.has(entry)) {
            this._files.addFile(entry, defaultCode, (p, code) => {
                this.globalState.files[p] = code;
                this._files.setDirty(true);
            });
            this.globalState.files[entry] = defaultCode;
            const model = this._files.getModel(entry)!;
            if (this._editorHost.editor) {
                this._editorHost.editor.setModel(model);
            }
        } else {
            const model = this._files.getModel(entry)!;
            if (!model.getValue()) {
                model.setValue(defaultCode);
            }
            this.switchActiveFile(entry);
        }

        if (!this.globalState.filesOrder || !this.globalState.filesOrder.length) {
            this.globalState.filesOrder = [entry];
            this.globalState.onFilesOrderChangedObservable?.notifyObservers();
        }
        this._files.setDirty(false);
        this._initializeFileState(entry);
        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();
        this.globalState.onRunRequiredObservable.notifyObservers();
    }

    private _setNewContent() {
        const editor = this._editorHost.editor;
        if (editor) {
            editor.setValue("");
        }

        this._files.setFiles({}, (p, code) => {
            this.globalState.files[p] = code;
            this._files.setDirty(true);
        });

        this.globalState.files = {};
        this.globalState.filesOrder = [];
        this.globalState.importsMap = {};
        this.globalState.entryFilePath = undefined as any;
        this.globalState.activeFilePath = undefined as any;
        this.globalState.currentSnippetToken = "";

        this.globalState.onFilesChangedObservable.notifyObservers();
        this.globalState.onManifestChangedObservable.notifyObservers();

        this._setDefaultContent();

        this.globalState.onRunRequiredObservable.notifyObservers();

        if (location.pathname.indexOf("pg/") !== -1) {
            (window as any).location.pathname = "";
        }

        this._syncBareImportStubsAsync();
    }

    private _resetEditor(resetMetadata?: boolean) {
        (window as any).location.hash = "";
        if (resetMetadata) {
            this.globalState.currentSnippetTitle = "";
            this.globalState.currentSnippetDescription = "";
            this.globalState.currentSnippetTags = "";
        }
        this._files.setDirty(true);
    }

    // ---------------- Typings / bare import stubs ----------------
    private _collectAllSourceTexts(): string[] {
        return Object.values(this.globalState.files || {});
    }

    private async _syncBareImportStubsAsync() {
        const specs = this._typings.discoverBareImports(this._collectAllSourceTexts());
        this._typings.installBareImportStubs(specs);
        await this._typings.acquireForAsync(specs);
    }

    public setTagCandidates(candidates: { name: string; tagName: string }[] | undefined) {
        this._codeAnalysis.setTagCandidates(candidates);
    }

    /**
     * Get the current editor host instance
     */
    public get editorHost() {
        return this._editorHost;
    }

    /**
     * Get the current files manager instance
     */
    public get filesManager() {
        return this._files;
    }

    /**
     * Get the current typings service instance
     */
    public get typingsService() {
        return this._typings;
    }

    public insertSnippet(snippetKey: string) {
        const editor = this._editorHost.editor;
        if (!editor) {
            return;
        }

        const template = this._templates.templates.find((t) => t.key === snippetKey);
        if (!template) {
            return;
        }

        const selection = editor.getSelection();
        if (selection) {
            const snippetController = editor.getContribution("snippetController2") as any;
            if (snippetController) {
                snippetController.insert(template.insertText, {
                    overwriteBefore: 0,
                    overwriteAfter: 0,
                    undoStopBefore: true,
                    undoStopAfter: true,
                    adjustWhitespace: true,
                });
            } else {
                editor.executeEdits("snippet", [
                    {
                        range: selection,
                        text: template.insertText,
                        forceMoveMarkers: true,
                    },
                ]);
            }
        }
    }

    public insertCodeAtCursor(code: string, indentation = 0) {
        const editor = this._editorHost.editor;
        if (!editor) {
            return;
        }

        const indentedCode = this._indentCode(code, indentation);
        const position = editor.getPosition();
        if (position) {
            editor.executeEdits("insert", [
                {
                    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    text: indentedCode,
                    forceMoveMarkers: true,
                },
            ]);
        }
    }

    private _indentCode(code: string, indentation: number): string {
        if (indentation <= 0) {
            return code;
        }

        const indent = " ".repeat(indentation);
        return code
            .split("\n")
            .map((line) => (line.length > 0 ? indent + line : line))
            .join("\n");
    }

    private async _resolveOneLocalAsync(fullSpec: string) {
        const picked = await this._pickDirectoryAsync();
        if (!picked) {
            return;
        }
        if (this._localPkgHandles.has(fullSpec)) {
            const existingInterval = this._localPkgIntervals.get(fullSpec);
            if (existingInterval) {
                clearInterval(existingInterval);
                this._localPkgIntervals.delete(fullSpec);
            }
        }

        let initial = await this._enumerateDirectoryAsync(picked.handle, true);
        // Monitor for changes every 3s
        const interval = setInterval(async () => {
            const next = await this._enumerateDirectoryAsync(picked.handle, true);
            let changed = false;
            if (next.files.length !== initial.files.length) {
                changed = true;
            } else {
                for (let i = 0; i < next.files.length; i++) {
                    if (next.files[i].path !== initial.files[i].path || next.files[i].lastModified !== initial.files[i].lastModified) {
                        changed = true;
                        break;
                    }
                }
            }
            if (!changed) {
                return;
            }
            Logger.Log(`Detected change in local package: ${fullSpec}, updating...`);
            const nextContent = await this._enumerateDirectoryAsync(picked.handle, false);
            if (nextContent.files.length === 0) {
                Logger.Warn(`No relevant files found in local package: ${fullSpec}, skipping update`);
                return;
            }
            await this._typings.mapLocalTypingsAsync(fullSpec, `${ParseSpec(fullSpec).name}@local`, nextContent.files);
            this._tsPipeline.forceSyncModels();
            this._syncBareImportStubsAsync();
            initial = next;
            this._localPkgHandles.set(fullSpec, nextContent.handle);
            this._publishLocalHandlesToWindow();
        }, 3000);

        this._localPkgIntervals.set(fullSpec, interval);
        this._localPkgHandles.set(fullSpec, picked.handle);
        this._publishLocalHandlesToWindow();
        await this._typings.mapLocalTypingsAsync(fullSpec, `${ParseSpec(fullSpec).name}@local`, picked.files);
        this._tsPipeline.forceSyncModels();
        this._syncBareImportStubsAsync();
    }

    private _hasFsAccessApi(): boolean {
        // @ts-expect-error: FS Access API
        return !!window.showDirectoryPicker;
    }

    private async _enumerateDirectoryAsync(
        handle: FileSystemDirectoryHandle,
        skipContent: boolean = false
    ): Promise<{
        dirName: string;
        handle: FileSystemDirectoryHandle;
        files: Array<{ path: string; content: string; lastModified: number }>;
    }> {
        const files: Array<{ path: string; content: string; lastModified: number }> = [];
        const skipDir = /^(node_modules|\.git|\.hg|\.svn|\.idea|\.vscode)$/i;
        const walkAsync = async (dir: FileSystemDirectoryHandle, prefix = "") => {
            // @ts-expect-error: .values() is not in TS lib yet
            for await (const entry of dir.values()) {
                if (entry.kind === "directory") {
                    if (skipDir.test(entry.name)) {
                        continue;
                    }
                    await walkAsync(entry as FileSystemDirectoryHandle, `${prefix}${entry.name}/`);
                } else {
                    const lower = entry.name.toLowerCase();
                    if (!(lower.endsWith(".d.ts") || entry.name === "package.json")) {
                        continue;
                    }
                    const file = await (entry as FileSystemFileHandle).getFile();
                    files.push({
                        path: `${prefix}${entry.name}`,
                        content: skipContent ? "" : await file.text(),
                        lastModified: file.lastModified,
                    });
                }
            }
        };

        await walkAsync(handle, "");
        return { dirName: handle.name, handle, files };
    }

    private async _pickDirectoryAsync(): Promise<{
        dirName: string;
        handle: FileSystemDirectoryHandle;
        files: Array<{ path: string; content: string; lastModified: number }>;
    } | null> {
        if (!this._hasFsAccessApi()) {
            alert("Your browser does not support the File System Access API. Please use a compatible browser like Chrome or Edge.");
            return null;
        }

        // @ts-expect-error: FS Access API
        const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker();

        // Ask for (and cache) read permission so we can re-read at runtime
        // @ts-expect-error request perms
        const perm = await handle.requestPermission?.({ mode: "read" });
        if (perm === "denied") {
            return null;
        }

        return await this._enumerateDirectoryAsync(handle);
    }

    private _publishLocalHandlesToWindow() {
        (window as any).__PG_LOCAL_PKG_HANDLES__ = Object.fromEntries(this._localPkgHandles);
    }

    private _onRequestLocalResolve = (fullSpec: RequestLocalResolve) => {
        Logger.Log("Requesting local package for: " + fullSpec.fullSpec);
    };

    public dispose() {
        Logger.Log("Disposing monaco manager");
        this._typings?.dispose();
        this._files?.dispose();
        this._tsPipeline?.dispose();
        this._editorHost?.dispose();

        // Clear any cached runners
        this.globalState.currentRunner?.dispose?.();
        this.globalState.currentRunner = undefined;

        // Clear caches
        this._lastRunConfig = null;
        this._lastRunConfigHash = null;
        this._localPkgHandles.clear();
    }
}
