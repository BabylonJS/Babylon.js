import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
// import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';

import * as languageFeatures from "monaco-editor/esm/vs/language/typescript/languageFeatures";

import type { GlobalState } from "../globalState";
import { Utilities } from "./utilities";
import { CompilationError } from "../components/errorDisplayComponent";
import { Observable } from "@dev/core";
import { debounce } from "ts-debounce";

import type { editor } from "monaco-editor/esm/vs/editor/editor.api";

//declare var monaco: any;

export class MonacoManager {
    private _editor: editor.IStandaloneCodeEditor;
    private _definitionWorker: Worker;
    private _tagCandidates: { name: string; tagName: string }[];
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
                const message = "Are you sure you want to leave. You have unsaved work.";
                evt.preventDefault();
                evt.returnValue = message;
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
                return;
            }

            if (this._editor) {
                this._editor?.setValue(code);
                this._isDirty = false;
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

        globalState.onFontSizeChangedObservable.add(() => {
            this._editor?.updateOptions({
                fontSize: parseInt(Utilities.ReadStringFromStore("font-size", "14")),
            });
        });

        globalState.onLanguageChangedObservable.add(async () => {
            await this.setupMonacoAsync(this._hostElement);
        });

        globalState.onThemeChangedObservable.add(() => {
            this._createEditor();
        });

        // Register a global observable for inspector to request code changes
        const pgConnect = {
            onRequestCodeChangeObservable: new Observable(),
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
            // reload to create a new pg if in full-path playground mode.
            window.location.pathname = "";
        }
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
            renderIndentGuides: true,
            minimap: {
                enabled: Utilities.ReadBoolFromStore("minimap", true),
            },
        };

        this._editor = monaco.editor.create(this._hostElement, editorOptions as any);

        const analyzeCodeDebounced = debounce(() => this._analyzeCodeAsync(), 500);
        this._editor.onDidChangeModelContent(() => {
            const newCode = this._editor.getValue();
            if (this.globalState.currentCode !== newCode) {
                this.globalState.currentCode = newCode;
                this._isDirty = true;
                analyzeCodeDebounced();
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
        ];

        let snapshot = "";
        // see if a snapshot should be used
        if (window.location.search.indexOf("snapshot=") !== -1) {
            snapshot = window.location.search.split("snapshot=")[1];
            // cleanup, just in case
            snapshot = snapshot.split("&")[0];
            for (let index = 0; index < declarations.length; index++) {
                declarations[index] = declarations[index].replace("https://preview.babylonjs.com", "https://babylonsnapshots.z22.web.core.windows.net/" + snapshot);
            }
        }

        let version = "";
        if (window.location.search.indexOf("version=") !== -1) {
            version = window.location.search.split("version=")[1];
            // cleanup, just in case
            version = version.split("&")[0];
            for (let index = 0; index < declarations.length; index++) {
                declarations[index] = declarations[index].replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version);
            }
        }

        // Local mode
        if (location.hostname === "localhost" && location.search.indexOf("dist") === -1) {
            for (let index = 0; index < declarations.length; index++) {
                declarations[index] = declarations[index].replace("https://preview.babylonjs.com/", "//localhost:1337/");
            }
        }

        declarations.push("https://preview.babylonjs.com/glTF2Interface/babylon.glTF2Interface.d.ts");
        declarations.push("https://assets.babylonjs.com/generated/Assets.d.ts");

        // Check for Unity Toolkit
        if (location.href.indexOf("UnityToolkit") !== -1 || Utilities.ReadBoolFromStore("unity-toolkit", false)) {
            declarations.push("https://cdn.jsdelivr.net/gh/BabylonJS/UnityExporter@master/Redist/Runtime/babylon.toolkit.d.ts");
            declarations.push("https://cdn.jsdelivr.net/gh/BabylonJS/UnityExporter@master/Redist/Runtime/unity.playground.d.ts");
        }

        const timestamp = typeof globalThis !== "undefined" && (globalThis as any).__babylonSnapshotTimestamp__ ? (globalThis as any).__babylonSnapshotTimestamp__ : 0;
        if (timestamp) {
            for (let index = 0; index < declarations.length; index++) {
                if (declarations[index].indexOf("preview.babylonjs.com") !== -1) {
                    declarations[index] = declarations[index] + "?t=" + timestamp;
                }
            }
        }

        let libContent = "";
        const responses = await Promise.all(declarations.map((declaration) => fetch(declaration)));
        const fallbackUrl = "https://babylonsnapshots.z22.web.core.windows.net/refs/heads/master";
        for (const response of responses) {
            if (!response.ok) {
                // attempt a fallback
                const fallbackResponse = await fetch(response.url.replace("https://preview.babylonjs.com", fallbackUrl));
                if (fallbackResponse.ok) {
                    libContent += await fallbackResponse.text();
                } else {
                    // eslint-disable-next-line no-console
                    console.log("missing declaration", response.url);
                }
            } else {
                libContent += await response.text();
            }
        }
        libContent += `
interface Window {
    engine: BABYLON.Engine;
    canvas: HTMLCanvasElement;
};

declare var engine: BABYLON.Engine;
declare var canvas: HTMLCanvasElement;
        `;

        this._createEditor();

        // Definition worker
        this._setupDefinitionWorker(libContent);

        // Setup the Monaco compilation pipeline, so we can reuse it directly for our scripting needs
        this._setupMonacoCompilationPipeline(libContent);

        // This is used for a vscode-like color preview for ColorX types
        this._setupMonacoColorProvider();

        if (initialCall) {
            // Load code templates
            const response = await fetch("templates.json");
            if (response.ok) {
                this._templates = await response.json();
            }

            // enhance templates with extra properties
            for (const template of this._templates) {
                template.kind = monaco.languages.CompletionItemKind.Snippet;
                template.sortText = "!" + template.label; // make sure templates are on top of the completion window
                template.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }

            this._hookMonacoCompletionProvider();
        }

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

        // Our built-in 'sphere' shape. Params: name, options, scene
        var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape. Params: name, options, scene
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

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
        const typescript = monaco.languages.typescript;

        if (this.globalState.language === "JS") {
            typescript.javascriptDefaults.setCompilerOptions({
                noLib: false,
                allowNonTsExtensions: true, // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
                allowJs: true,
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
            this._tagCandidates = data.result;
            this._analyzeCodeAsync();
        });
        this._definitionWorker.postMessage({
            code: libContent,
        });
    }

    // This will make sure that all members marked with an interesting jsdoc attribute will be marked as such in Monaco UI
    // We use a prefiltered list of tag candidates, because the effective call to Monaco API can be slow.
    // @see setupDefinitionWorker
    private async _analyzeCodeAsync() {
        // if the definition worker is very fast, this can be called out of context. @see setupDefinitionWorker
        if (!this._editor) {
            return;
        }

        if (!this._tagCandidates) {
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
        const source = "[preview]";

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

        for (const candidate of this._tagCandidates) {
            const matches = model.findMatches(candidate.name, false, false, true, null, false);
            if (!matches) continue;

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

                // the following is time consuming on all suggestions, that's why we precompute tag candidate names in the definition worker to filter calls
                // @see setupDefinitionWorker
                const details = await languageService.getCompletionEntryDetails(uri.toString(), offset, wordInfo.word);
                if (!details || !details.tags) continue;

                const tag = details.tags.find((t: { name: string }) => t.name === candidate.tagName);
                if (tag) {
                    markers.push({
                        startLineNumber: match.range.startLineNumber,
                        endLineNumber: match.range.endLineNumber,
                        startColumn: wordInfo.startColumn,
                        endColumn: wordInfo.endColumn,
                        message: this._getTagMessage(tag),
                        severity: this._getCandidateMarkerSeverity(candidate),
                        source: source,
                    });
                }
            }
        }

        monaco.editor.setModelMarkers(model, source, markers);
    }

    private _getCandidateMarkerSeverity(candidate: { tagName: string }) {
        switch (candidate.tagName) {
            case "deprecated":
                return monaco.MarkerSeverity.Warning;
            default:
                return monaco.MarkerSeverity.Info;
        }
    }

    private _getCandidateCompletionSuffix(candidate: { tagName: string }) {
        switch (candidate.tagName) {
            case "deprecated":
                return "⚠️";
            default:
                return "🧪";
        }
    }

    private _getTagMessage(tag: any) {
        if (tag?.text instanceof String) {
            if (tag.text.indexOf("data:") === 0) {
                return `<img src="${tag.text}">`;
            }
            return tag.text;
        }

        if (tag?.text instanceof Array)
            return tag.text
                .filter((i: { kind: string }) => i.kind === "text")
                .map((i: { text: any }) => (i.text.indexOf("data:") === 0 ? `<img src="${i.text}">` : i.text))
                .join(", ");

        return "";
    }

    // This is our hook in the Monaco suggest adapter, we are called everytime a completion UI is displayed
    // So we need to be super fast.
    private async _hookMonacoCompletionProvider() {
        const oldProvideCompletionItems = languageFeatures.SuggestAdapter.prototype.provideCompletionItems;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const owner = this;

        languageFeatures.SuggestAdapter.prototype.provideCompletionItems = async function (model: any, position: any, context: any, token: any) {
            // reuse 'this' to preserve context through call (using apply)
            const result = await oldProvideCompletionItems.apply(this, [model, position, context, token]);

            if (!result || !result.suggestions) {
                return result;
            }

            // filter non public members
            const suggestions = result.suggestions.filter((item: any) => !item.label.startsWith("_"));

            for (const suggestion of suggestions) {
                const candidate = owner._tagCandidates.find((t) => t.name === suggestion.label);
                if (candidate) {
                    // the following is time consuming on all suggestions, that's why we precompute deprecated candidate names in the definition worker to filter calls
                    // @see setupDefinitionWorker
                    const uri = suggestion.uri;
                    const worker = await this._worker(uri);
                    const model = monaco.editor.getModel(uri);
                    const details = await worker.getCompletionEntryDetails(uri.toString(), model!.getOffsetAt(position), suggestion.label);

                    if (!details || !details.tags) continue;

                    const tag = details.tags.find((t: { name: string }) => t.name === candidate.tagName);
                    if (tag) {
                        const suffix = owner._getCandidateCompletionSuffix(candidate);
                        suggestion.label = suggestion.label + suffix;
                    }
                }
            }

            // add our own templates when invoked without context
            if (context.triggerKind == monaco.languages.CompletionTriggerKind.Invoke) {
                const language = owner.globalState.language === "JS" ? "javascript" : "typescript";
                for (const template of owner._templates) {
                    if (template.language && language !== template.language) {
                        continue;
                    }

                    suggestions.push(template);
                }
            }

            // preserve incomplete flag or force it when the definition is not yet analyzed
            const incomplete = (result.incomplete && result.incomplete == true) || owner._tagCandidates.length == 0;
            return {
                suggestions: JSON.parse(JSON.stringify(suggestions)),
                incomplete: incomplete,
            };
        };
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
