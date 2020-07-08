import * as React from "react";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

require("../scss/monaco.scss");

interface IMonacoComponentProps {
    language: "JS" | "TS";
}

export class MonacoComponent extends React.Component<IMonacoComponentProps> {
    private _hostReference: React.RefObject<HTMLDivElement>;
    private _editor: any;
    private _definitionWorker: Worker;
    private _deprecatedCandidates: string[];
   // private _templates: string[];
    
    public constructor(props: IMonacoComponentProps) {
        super(props);

        this._hostReference = React.createRef();
    }

    async setupMonaco() {        
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


        let hostElement = this._hostReference.current!;  
        var editorOptions = {
            value: "",
            language: this.props.language == "JS" ? "javascript" : "typescript",
            lineNumbers: "on",
            roundedSelection: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            theme: "vs",
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

        //   this.setupDefinitionWorker(libContent);

            // Load code templates
        //   response = await fetch("/templates.json");
        // if (response.ok) {
        //      this._templates = await response.json();
            //}

            // Setup the Monaco compilation pipeline, so we can reuse it directly for our scrpting needs
            this.setupMonacoCompilationPipeline(libContent);

            // This is used for a vscode-like color preview for ColorX types
            //this.setupMonacoColorProvider();
    }

      // Provide an adornment for BABYLON.ColorX types: color preview
    setupMonacoColorProvider() {
        monaco.languages.registerColorProvider(this.props.language == "JS" ? "javascript" : "typescript", {
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
    setupMonacoCompilationPipeline(libContent: string) {
        var typescript = monaco.languages.typescript;

        // if (!typescript) {
        //     setTimeout(() => {
        //             console.log("Retry")
        //         this.setupMonacoCompilationPipeline(libContent);

        //     }, 500)
        //     return;
        // }

        if (this.props.language === "JS") {
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

    setupDefinitionWorker(libContent: string) {
        this._definitionWorker = new Worker('workers/definitionWorker.js');
        this._definitionWorker.addEventListener('message', ({
            data
        }) => {
            this._deprecatedCandidates = data.result;
            this.analyzeCode();
        });
        this._definitionWorker.postMessage({
            code: libContent
        });
    }

    // This will make sure that all members marked with a deprecated jsdoc attribute will be marked as such in Monaco UI
    // We use a prefiltered list of deprecated candidates, because the effective call to getCompletionEntryDetails is slow.
    // @see setupDefinitionWorker
    async analyzeCode() {
        // if the definition worker is very fast, this can be called out of context. @see setupDefinitionWorker
        if (!this._editor)
            return;

        const model = this._editor.getModel();
        if (!model)
            return;

        const uri = model.uri;

        let worker = null;
        if (this.props.language == "JS")
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

    componentDidMount() {
       this.setupMonaco();
    }

    public render() {

        return (
            <div id="monacoHost" ref={this._hostReference}>               
            </div>   
        )
    }
}