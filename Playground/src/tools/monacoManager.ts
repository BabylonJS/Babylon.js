import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
// import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';

import * as languageFeatures from "monaco-editor/esm/vs/language/typescript/languageFeatures";

import { GlobalState } from "../globalState";
import { Utilities } from "./utilities";
import { CompilationError } from "../components/errorDisplayComponent";

declare type IStandaloneCodeEditor = import("monaco-editor/esm/vs/editor/editor.api").editor.IStandaloneCodeEditor;
declare type IStandaloneEditorConstructionOptions = import("monaco-editor/esm/vs/editor/editor.api").editor.IStandaloneEditorConstructionOptions;

//declare var monaco: any;

export class MonacoManager {
    private _editor: IStandaloneCodeEditor;
    private _definitionWorker: Worker;
    private _deprecatedCandidates: string[];
    private _hostElement: HTMLDivElement;
    private _templates: {
        label: string;
        language: string;
        kind: number;
        sortText: string;
        insertTextRules: number;
    }[];

    private _isDirty = false;

    public constructor(public globalState: GlobalState) {
        window.addEventListener("beforeunload", (evt) => {
            if (this._isDirty && Utilities.ReadBoolFromStore("safe-mode", false)) {
                var message = "Are you sure you want to leave. You have unsaved work.";
                evt.preventDefault();
                evt.returnValue = message;
            }
        });

        globalState.onNewRequiredObservable.add(() => {
            if (Utilities.CheckSafeMode("Are you sure you want to create a new playground?")) {
                this._setNewContent();
                this._isDirty = true;
            }
        });

        globalState.onClearRequiredObservable.add(() => {
            if (Utilities.CheckSafeMode("Are you sure you want to remove all your code?")) {
                this._editor?.setValue("");
                location.hash = "";
                this._isDirty = true;
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
                return;
            }

            if (this._editor) {
                this._editor?.setValue(code);
                this.globalState.onRunRequiredObservable.notifyObservers();
            } else {
                this.globalState.currentCode = code;
            }
        });

        globalState.onFormatCodeRequiredObservable.add(() => {
            this._editor?.getAction("editor.action.formatDocument").run();
        });

        globalState.onMinimapChangedObservable.add((value) => {
            this._editor?.updateOptions({
                minimap: {
                    enabled: value,
                },
            });
        });

        globalState.onFontSizeChangedObservable.add((value) => {
            this._editor?.updateOptions({
                fontSize: parseInt(Utilities.ReadStringFromStore("font-size", "14")),
            });
        });

        globalState.onLanguageChangedObservable.add(() => {
            this.setupMonacoAsync(this._hostElement);
        });

        globalState.onThemeChangedObservable.add(() => {
            this._createEditor();
        });

        // Register a global observable for inspector to request code changes
        let pgConnect = {
            onRequestCodeChangeObservable: new BABYLON.Observable(),
        };

        pgConnect.onRequestCodeChangeObservable.add((options: any) => {
            let code = this._editor?.getValue() || "";
            code = code.replace(options.regex, options.replace);

            this._editor?.setValue(code);
        });

        (window as any).Playground = pgConnect;
    }

    private _setNewContent() {
        this._createEditor();
        this._editor?.setValue(`// You have to create a function called createScene. This function must return a BABYLON.Scene object
    // You can reference the following variables: scene, canvas
    // You must at least define a camera

    var createScene = function() {
        var scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        return scene;
    };
        `);

        this.globalState.onRunRequiredObservable.notifyObservers();

        location.hash = "";
        if (location.pathname.indexOf("pg/") !== -1) {
            // reload to create a new pg if in full-path playground mode.
            window.location.pathname = "";
        }
    }

    private _createEditor() {
        if (this._editor) {
            this._editor.dispose();
        }

        var editorOptions: IStandaloneEditorConstructionOptions = {
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
            renderIndentGuides: true,
            minimap: {
                enabled: Utilities.ReadBoolFromStore("minimap", true),
            },
        };

        this._editor = monaco.editor.create(this._hostElement, editorOptions as any);

        this._editor.onDidChangeModelContent(() => {
            let newCode = this._editor.getValue();
            if (this.globalState.currentCode !== newCode) {
                this.globalState.currentCode = newCode;
                this._isDirty = true;
            }
        });

        if (this.globalState.currentCode) {
            this._editor!.setValue(this.globalState.currentCode);
        }

        this.globalState.getCompiledCode = () => this._getRunCode();

        if (this.globalState.currentCode) {
            this.globalState.onRunRequiredObservable.notifyObservers();
        }
    }

    public async setupMonacoAsync(hostElement: HTMLDivElement) {
        this._hostElement = hostElement;

        let response = await fetch("https://preview.babylonjs.com/babylon.d.ts");
        if (!response.ok) {
            return;
        }

        let libContent = await response.text();

        response = await fetch("https://preview.babylonjs.com/gui/babylon.gui.d.ts");
        if (!response.ok) {
            return;
        }

        libContent += await response.text();

        this._createEditor();

        // Definition worker
        this._setupDefinitionWorker(libContent);

        // Load code templates
        response = await fetch("templates.json");
        if (response.ok) {
            this._templates = await response.json();
        }

        // Setup the Monaco compilation pipeline, so we can reuse it directly for our scrpting needs
        this._setupMonacoCompilationPipeline(libContent);

        // This is used for a vscode-like color preview for ColorX types
        this._setupMonacoColorProvider();

        // enhance templates with extra properties
        for (const template of this._templates) {
            (template.kind = monaco.languages.CompletionItemKind.Snippet), (template.sortText = "!" + template.label); // make sure templates are on top of the completion window
            template.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
        }

        this._hookMonacoCompletionProvider();

        if (!this.globalState.loadingCodeInProgress) {
            this._setDefaultContent();
        }
    }

    private _setDefaultContent() {
        if (this.globalState.language === "JS") {
            this._editor.setValue(`var createScene = function () {
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

};`);
        } else {
            this._editor.setValue(`class Playground {
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
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
        var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

        return scene;
    }
}`);
        }

        this._isDirty = false;

        this.globalState.onRunRequiredObservable.notifyObservers();
    }

    // Provide an adornment for BABYLON.ColorX types: color preview
    protected _setupMonacoColorProvider() {
        monaco.languages.registerColorProvider(this.globalState.language == "JS" ? "javascript" : "typescript", {
            provideColorPresentations: (model: any, colorInfo: any) => {
                const color = colorInfo.color;

                const precision = 100.0;
                const converter = (n: number) => Math.round(n * precision) / precision;

                let label;
                if (color.alpha === undefined || color.alpha === 1.0) {
                    label = `(${converter(color.red)}, ${converter(color.green)}, ${converter(color.blue)})`;
                } else {
                    label = `(${converter(color.red)}, ${converter(color.green)}, ${converter(color.blue)}, ${converter(color.alpha)})`;
                }

                return [
                    {
                        label: label,
                    },
                ];
            },

            provideDocumentColors: (model: any) => {
                const digitGroup = "\\s*(\\d*(?:\\.\\d+)?)\\s*";
                // we add \n{0} to workaround a Monaco bug, when setting regex options on their side
                const regex = `BABYLON\\.Color(?:3|4)\\s*\\(${digitGroup},${digitGroup},${digitGroup}(?:,${digitGroup})?\\)\\n{0}`;
                const matches = model.findMatches(regex, false, true, true, null, true);

                const converter = (g: string) => (g === undefined ? undefined : Number(g));

                return matches.map((match: any) => ({
                    color: {
                        red: converter(match.matches![1])!,
                        green: converter(match.matches![2])!,
                        blue: converter(match.matches![3])!,
                        alpha: converter(match.matches![4])!,
                    },
                    range: {
                        startLineNumber: match.range.startLineNumber,
                        startColumn: match.range.startColumn + match.matches![0].indexOf("("),
                        endLineNumber: match.range.startLineNumber,
                        endColumn: match.range.endColumn,
                    },
                }));
            },
        });
    }

    // Setup both JS and TS compilation pipelines to work with our scripts.
    protected _setupMonacoCompilationPipeline(libContent: string) {
        var typescript = monaco.languages.typescript;

        if (this.globalState.language === "JS") {
            typescript.javascriptDefaults.setCompilerOptions({
                noLib: false,
                allowNonTsExtensions: true, // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
            });

            typescript.javascriptDefaults.addExtraLib(libContent, "babylon.d.ts");
        } else {
            typescript.typescriptDefaults.setCompilerOptions({
                module: typescript.ModuleKind.AMD,
                target: typescript.ScriptTarget.ESNext,
                noLib: false,
                strict: false,
                alwaysStrict: false,
                strictFunctionTypes: false,
                suppressExcessPropertyErrors: false,
                suppressImplicitAnyIndexErrors: true,
                noResolve: true,
                suppressOutputPathCheck: true,

                allowNonTsExtensions: true, // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
            });
            typescript.typescriptDefaults.addExtraLib(libContent, "babylon.d.ts");
        }
    }

    protected _setupDefinitionWorker(libContent: string) {
        this._definitionWorker = new Worker("workers/definitionWorker.js");
        this._definitionWorker.addEventListener("message", ({ data }) => {
            this._deprecatedCandidates = data.result;
            this._analyzeCodeAsync();
        });
        this._definitionWorker.postMessage({
            code: libContent,
        });
    }

    // This will make sure that all members marked with a deprecated jsdoc attribute will be marked as such in Monaco UI
    // We use a prefiltered list of deprecated candidates, because the effective call to getCompletionEntryDetails is slow.
    // @see setupDefinitionWorker
    private async _analyzeCodeAsync() {
        // if the definition worker is very fast, this can be called out of context. @see setupDefinitionWorker
        if (!this._editor) {
            return;
        }

        const model = this._editor.getModel();
        if (!model) {
            return;
        }

        const uri = model.uri;

        let worker = null;
        if (this.globalState.language === "JS") {
            worker = await monaco.languages.typescript.getJavaScriptWorker();
        } else {
            worker = await monaco.languages.typescript.getTypeScriptWorker();
        }

        const languageService = await worker(uri);
        const source = "[deprecated members]";

        monaco.editor.setModelMarkers(model, source, []);
        const markers: {
            startLineNumber: number;
            endLineNumber: number;
            startColumn: number;
            endColumn: number;
            message: string;
            severity: number;
            source: string;
        }[] = [];

        for (const candidate of this._deprecatedCandidates) {
            const matches = model.findMatches(candidate, false, false, true, null, false);
            for (const match of matches) {
                const position = {
                    lineNumber: match.range.startLineNumber,
                    column: match.range.startColumn,
                };
                const wordInfo = model.getWordAtPosition(position);
                const offset = model.getOffsetAt(position);

                if (!wordInfo) {
                    continue;
                }

                // continue if we already found an issue here
                if (markers.find((m) => m.startLineNumber == position.lineNumber && m.startColumn == position.column)) {
                    continue;
                }

                // the following is time consuming on all suggestions, that's why we precompute deprecated candidate names in the definition worker to filter calls
                // @see setupDefinitionWorker
                const details = await languageService.getCompletionEntryDetails(uri.toString(), offset, wordInfo.word);
                if (this._isDeprecatedEntry(details)) {
                    const deprecatedInfo = details.tags.find(this._isDeprecatedTag);
                    markers.push({
                        startLineNumber: match.range.startLineNumber,
                        endLineNumber: match.range.endLineNumber,
                        startColumn: wordInfo.startColumn,
                        endColumn: wordInfo.endColumn,
                        message: deprecatedInfo.text,
                        severity: monaco.MarkerSeverity.Warning,
                        source: source,
                    });
                }
            }
        }

        monaco.editor.setModelMarkers(model, source, markers);
    }

    // This is our hook in the Monaco suggest adapter, we are called everytime a completion UI is displayed
    // So we need to be super fast.
    private async _hookMonacoCompletionProvider() {
        const oldProvideCompletionItems = languageFeatures.SuggestAdapter.prototype.provideCompletionItems;
        // tslint:disable-next-line:no-this-assignment
        const owner = this;

        languageFeatures.SuggestAdapter.prototype.provideCompletionItems = async function (model: any, position: any, context: any, token: any) {
            // reuse 'this' to preserve context through call (using apply)
            const result = await oldProvideCompletionItems.apply(this, [model, position, context, token]);

            if (!result || !result.suggestions) {
                return result;
            }

            const suggestions = result.suggestions.filter((item: any) => !item.label.startsWith("_"));

            for (const suggestion of suggestions) {
                if (owner._deprecatedCandidates.includes(suggestion.label)) {
                    // the following is time consuming on all suggestions, that's why we precompute deprecated candidate names in the definition worker to filter calls
                    // @see setupDefinitionWorker
                    const uri = suggestion.uri;
                    const worker = await this._worker(uri);
                    const model = monaco.editor.getModel(uri);
                    const details = await worker.getCompletionEntryDetails(uri.toString(), model!.getOffsetAt(position), suggestion.label);

                    if (owner._isDeprecatedEntry(details)) {
                        suggestion.tags = [monaco.languages.CompletionItemTag.Deprecated];
                    }
                }
            }

            // add our own templates when invoked without context
            if (context.triggerKind == monaco.languages.CompletionTriggerKind.Invoke) {
                let language = owner.globalState.language === "JS" ? "javascript" : "typescript";
                for (const template of owner._templates) {
                    if (template.language && language !== template.language) {
                        continue;
                    }

                    suggestions.push(template);
                }
            }

            // preserve incomplete flag or force it when the definition is not yet analyzed
            const incomplete = (result.incomplete && result.incomplete == true) || owner._deprecatedCandidates.length == 0;

            return {
                suggestions: suggestions,
                incomplete: incomplete,
            };
        };
    }

    private _isDeprecatedEntry(details: any) {
        return details && details.tags && details.tags.find(this._isDeprecatedTag);
    }

    private _isDeprecatedTag(tag: any) {
        return tag && tag.name == "deprecated";
    }

    private async _getRunCode() {
        if (this.globalState.language == "JS") {
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
