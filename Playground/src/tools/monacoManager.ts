import 'monaco-editor/esm/vs/editor/editor.api';

import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';

import { GlobalState } from '../globalState';

declare type IStandaloneCodeEditor = import('monaco-editor/esm/vs/editor/editor.api').editor.IStandaloneCodeEditor;
declare type IEditorConstructionOptions = import('monaco-editor/esm/vs/editor/editor.api').editor.IEditorConstructionOptions;

declare var monaco: any;

export class MonacoManager {
    private _editor: IStandaloneCodeEditor;
    private _definitionWorker: Worker;
    private _deprecatedCandidates: string[];
    // private _templates: string[];

    public constructor(public globalState: GlobalState) {
        globalState.onNewRequiredObservable.add(() => {
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
            globalState.onRunRequiredObservable.notifyObservers();
        });
    }

    public async setupMonacoAsync(hostElement: HTMLDivElement) {
        // let response = await fetch("https://preview.babylonjs.com/babylon.d.ts");
        // if (!response.ok) {
        //     return;
        // }

        // let libContent = await response.text();

        // response = await fetch("https://preview.babylonjs.com/gui/babylon.gui.d.ts");
        // if (!response.ok) {
        //     return;
        // }

        // libContent += await response.text();

        //   this.setupDefinitionWorker(libContent);

            // Load code templates
        //   response = await fetch("/templates.json");
        // if (response.ok) {
        //      this._templates = await response.json();
            //}

        // Setup the Monaco compilation pipeline, so we can reuse it directly for our scrpting needs
        //this.setupMonacoCompilationPipeline(libContent);

            // This is used for a vscode-like color preview for ColorX types
            //this.setupMonacoColorProvider();

        var editorOptions: IEditorConstructionOptions = {
            value: "",
            language: this.globalState.language === "JS" ? "javascript" : "typescript",
            lineNumbers: "on",
            roundedSelection: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            theme: "vs-dark",
            contextmenu: false,
            folding: true,
            showFoldingControls: "always",
            renderIndentGuides: true,
            minimap: {
                enabled: true
            }
        };      

        this._editor = monaco.editor.create(
            hostElement,
            editorOptions as any
        );     
        
        this._editor.onDidChangeModelContent(() => {
            this.globalState.currentCode = this._editor.getValue();
        });
        
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
    
    };`
        );
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

                return [{
                    label: label
                }];
            },

            provideDocumentColors: (model: any) => {
                const digitGroup = "\\s*(\\d*(?:\\.\\d+)?)\\s*";
                // we add \n{0} to workaround a Monaco bug, when setting regex options on their side
                const regex = `BABYLON\\.Color(?:3|4)\\s*\\(${digitGroup},${digitGroup},${digitGroup}(?:,${digitGroup})?\\)\\n{0}`;
                const matches = model.findMatches(regex, false, true, true, null, true);

                const converter = (g: string) => g === undefined ? undefined : Number(g);

                return matches.map((match: any) => ({
                    color: {
                        red: converter(match.matches![1])!,
                        green: converter(match.matches![2])!,
                        blue: converter(match.matches![3])!,
                        alpha: converter(match.matches![4])!
                    },
                    range: {
                        startLineNumber: match.range.startLineNumber,
                        startColumn: match.range.startColumn + match.matches![0].indexOf("("),
                        endLineNumber: match.range.startLineNumber,
                        endColumn: match.range.endColumn
                    }
                }));
            }
        });
    }

    // Setup both JS and TS compilation pipelines to work with our scripts. 
    protected _setupMonacoCompilationPipeline(libContent: string) {
        var typescript = monaco.languages.typescript;

        if (this.globalState.language === "JS") {
            typescript.javascriptDefaults.setCompilerOptions({
                noLib: false,
                allowNonTsExtensions: true // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
            });

            typescript.javascriptDefaults.addExtraLib(libContent, 'babylon.d.ts');
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

                allowNonTsExtensions: true // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
            });
            typescript.typescriptDefaults.addExtraLib(libContent, 'babylon.d.ts');
        }
    }

    protected _setupDefinitionWorker(libContent: string) {
        this._definitionWorker = new Worker('workers/definitionWorker.js');
        this._definitionWorker.addEventListener('message', ({
            data
        }) => {
            this._deprecatedCandidates = data.result;
            this._analyzeCodeAsync();
        });
        this._definitionWorker.postMessage({
            code: libContent
        });
    }

    // This will make sure that all members marked with a deprecated jsdoc attribute will be marked as such in Monaco UI
    // We use a prefiltered list of deprecated candidates, because the effective call to getCompletionEntryDetails is slow.
    // @see setupDefinitionWorker
    private async _analyzeCodeAsync() {
        // if the definition worker is very fast, this can be called out of context. @see setupDefinitionWorker
        if (!this._editor)
            return;

        const model = this._editor.getModel();
        if (!model)
            return;

        const uri = model.uri;

        let worker = null;
        if (this.globalState.language === "JS")
            worker = await monaco.languages.typescript.getJavaScriptWorker();
        else
            worker = await monaco.languages.typescript.getTypeScriptWorker();

        const languageService = await worker(uri);
        const source = '[deprecated members]';

        monaco.editor.setModelMarkers(model, source, []);
        const markers: {
            startLineNumber: number,
            endLineNumber: number,
            startColumn: number,
            endColumn: number,
            message: string,
            severity: number,
            source: string,
        }[] = [];

        for (const candidate of this._deprecatedCandidates) {
            const matches = model.findMatches(candidate, false, false, true, null, false);
            for (const match of matches) {
                const position = {
                    lineNumber: match.range.startLineNumber,
                    column: match.range.startColumn
                };
                const wordInfo = model.getWordAtPosition(position);
                const offset = model.getOffsetAt(position);

                if (!wordInfo) {
                    continue;
                }

                // continue if we already found an issue here
                if (markers.find(m => m.startLineNumber == position.lineNumber && m.startColumn == position.column))
                    continue;

                // the following is time consuming on all suggestions, that's why we precompute deprecated candidate names in the definition worker to filter calls
                // @see setupDefinitionWorker
                const details = await languageService.getCompletionEntryDetails(uri.toString(), offset, wordInfo.word);
                if (this.isDeprecatedEntry(details)) {
                    const deprecatedInfo = details.tags.find(this.isDeprecatedTag);
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

    isDeprecatedEntry(details: any) {
        return details &&
            details.tags &&
            details.tags.find(this.isDeprecatedTag);
    }

    isDeprecatedTag(tag: any) {
        return tag &&
            tag.name == "deprecated";
    }
}