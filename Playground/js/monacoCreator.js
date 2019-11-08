/**
 * This JS file is for Monaco management
 */
class MonacoCreator {
    constructor(parent) {
        this.parent = parent;
        
        this.jsEditor = null;
        this.diffEditor = null;
        this.diffNavigator = null;
        this.monacoMode = "javascript";
        this.blockEditorChange = false;

        this.compilerTriggerTimeoutID = null;
    }

    // ACCESSORS

    get JsEditor() {
        return this.jsEditor;
    };

    getCode() {
        if(this.jsEditor) return this.jsEditor.getValue();
        else return "";
    };
    setCode(value) {
        this.jsEditor.setValue(value);
    };

    get MonacoMode() {
        return this.monacoMode;
    };
    set MonacoMode(mode) {
        if (this.monacoMode != "javascript"
            && this.monacoMode != "typescript")
            console.warn("Error while defining Monaco Mode");
        this.monacoMode = mode;
    };

    get BlockEditorChange() {
        return this.blockEditorChange;
    };
    set BlockEditorChange(value) {
        this.blockEditorChange = value;
    };

    // FUNCTIONS

    /**
     * Load the Monaco Node module.
     */
    loadMonaco(typings) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', typings || "babylon.d.txt", true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });
                    require(['vs/editor/editor.main'], function () {
                        this.setupMonacoCompilationPipeline(xhr.responseText);
                        this.setupMonacoColorProvider();

                        this.parent.main.run();
                    }.bind(this));
                }
            }
        }.bind(this);
        xhr.send(null);
    };

    setupMonacoCompilationPipeline(libContent) {
        const typescript = monaco.languages.typescript;

        if (this.monacoMode === "javascript") {
            typescript.javascriptDefaults.setCompilerOptions({
                noLib: false,
                allowNonTsExtensions: true // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
            });

            typescript.javascriptDefaults.addExtraLib(libContent, 'babylon.d.ts');
        } else {
            typescript.typescriptDefaults.setCompilerOptions({
                module: typescript.ModuleKind.AMD,
                target: typescript.ScriptTarget.ES5,
                noLib: false,
                noResolve: true,
                suppressOutputPathCheck: true,

                allowNonTsExtensions: true // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
            });
            typescript.typescriptDefaults.addExtraLib(libContent, 'babylon.d.ts');
        }
    }

    setupMonacoColorProvider() {
        monaco.languages.registerColorProvider(this.monacoMode, {
            provideColorPresentations: (model, colorInfo) => {
                const color = colorInfo.color;
                
                const precision = 100.0;
                const converter = (n) => Math.round(n * precision) / precision;
                
                let label;
                if (color.alpha === undefined || color.alpha === 1.0) {
                    label = `(${converter(color.red)}, ${converter(color.green)}, ${converter(color.blue)})`;
                } else {
                    label = `(${converter(color.red)}, ${converter(color.green)}, ${converter(color.blue)}, ${converter(color.alpha)})`;
                }
        
                return [ { label: label } ];
            },

            provideDocumentColors: (model) => {
                const digitGroup = "\\s*(\\d*(?:\\.\\d+)?)\\s*";
                // we add \n{0} to workaround a Monaco bug, when setting regex options on their side
                const regex = `BABYLON\\.Color(?:3|4)\\s*\\(${digitGroup},${digitGroup},${digitGroup}(?:,${digitGroup})?\\)\\n{0}`;
                const matches = model.findMatches(regex, null, true, true, null, true);

                const converter = (g) => g === undefined ? undefined : Number(g);

                return matches.map(match => ({
                    color: { 
                        red: converter(match.matches[1]), 
                        green: converter(match.matches[2]), 
                        blue: converter(match.matches[3]),
                        alpha: converter(match.matches[4])
                    },
                    range:{
                        startLineNumber: match.range.startLineNumber,
                        startColumn: match.range.startColumn + match.matches[0].indexOf("("),
                        endLineNumber: match.range.startLineNumber,
                        endColumn: match.range.endColumn
                    }
                }));
            }
        });
    }

    /**
     * Function to (re)create the editor
     */
    createMonacoEditor() {
        var oldCode = "";
        if (this.jsEditor) {
            oldCode = this.jsEditor.getValue();
            this.jsEditor.dispose();
        }

        var editorOptions = {
            value: "",
            language: this.monacoMode,
            lineNumbers: true,
            tabSize: "auto",
            insertSpaces: "auto",
            roundedSelection: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            theme: this.parent.settingsPG.vsTheme,
            contextmenu: false,
            folding: true,
            showFoldingControls: "always",
            renderIndentGuides: true,
            minimap: {
                enabled: true
            }
        };
        editorOptions.minimap.enabled = document.getElementById("minimapToggle1280").classList.contains('checked');
        this.jsEditor = monaco.editor.create(document.getElementById('jsEditor'), editorOptions);

        this.jsEditor.setValue(oldCode);
        this.jsEditor.onKeyUp(function () {
            this.parent.utils.markDirty();
        }.bind(this));
    };

    detectLanguage(text) {
        return text && text.indexOf("class Playground") >= 0 ? "typescript" : "javascript";
    }

    createDiff(left, right, diffView) {
        const language = this.detectLanguage(left);
        let leftModel = monaco.editor.createModel(left, language);
        let rightModel = monaco.editor.createModel(right, language);
        const diffOptions = {
            contextmenu: false,
            lineNumbers: true,
            readOnly: true,
            theme: this.parent.settingsPG.vsTheme,
            contextmenu: false,
            fontSize: this.parent.settingsPG.fontSize
        }

        this.diffEditor = monaco.editor.createDiffEditor(diffView, diffOptions);
        this.diffEditor.setModel({
            original: leftModel,
            modified: rightModel
        });

        this.diffNavigator = monaco.editor.createDiffNavigator(this.diffEditor, {
            followsCaret: true,
            ignoreCharChanges: true
        });
        
        const menuPG = this.parent.menuPG;
        const main = this.parent.main;
        const monacoCreator = this;

        this.diffEditor.addCommand(monaco.KeyCode.Escape, function() { main.toggleDiffEditor(monacoCreator, menuPG); });
        // Adding default VSCode bindinds for previous/next difference
        this.diffEditor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.F5, function() { main.navigateToNext(); });
        this.diffEditor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.F5, function() { main.navigateToPrevious(); });

        this.diffEditor.focus();
    }

    disposeDiff() {
        if (!this.diffEditor)
            return;

        // We need to properly dispose, else the monaco script editor will use those models in the editor compilation pipeline!
        let model = this.diffEditor.getModel();
        let leftModel = model.original;
        let rightModel = model.modified;
        
        leftModel.dispose();
        rightModel.dispose();

        this.diffNavigator.dispose();
        this.diffEditor.dispose();

        this.diffNavigator = null;
        this.diffEditor = null;
    }

    /**
     * Format the code in the editor
     */
    formatCode () {
        this.jsEditor.getAction('editor.action.formatDocument').run();
    };

    /**
     * Toggle the minimap
     */
    toggleMinimap () {
        var minimapToggle = document.getElementById("minimapToggle1280");
        if (minimapToggle.classList.contains('checked')) {
            this.jsEditor.updateOptions({ minimap: { enabled: false } });
            this.parent.utils.setToMultipleID("minimapToggle", "innerHTML", 'Minimap <i class="fa fa-square" aria-hidden="true"></i>');
        } else {
            this.jsEditor.updateOptions({ minimap: { enabled: true } });
            this.parent.utils.setToMultipleID("minimapToggle", "innerHTML", 'Minimap <i class="fa fa-check-square" aria-hidden="true"></i>');
        }
        minimapToggle.classList.toggle('checked');
    };

    /**
     * Get the code in the editor
     */
    async getRunCode() {
        var parent = this.parent;

        if (parent.settingsPG.ScriptLanguage == "JS")
            return this.jsEditor.getValue();

        else if (parent.settingsPG.ScriptLanguage == "TS") {
            const model = this.jsEditor.getModel();
            const uri = model.uri;

            const worker = await monaco.languages.typescript.getTypeScriptWorker();
            const languageService = await worker(uri);

            const uriStr = uri.toString();
            const result = await languageService.getEmitOutput(uriStr);
            const diagnostics = await Promise.all([languageService.getSyntacticDiagnostics(uriStr), languageService.getSemanticDiagnostics(uriStr)]);

            diagnostics.forEach(function(diagset) {
                if (diagset.length) {
                    const diagnostic = diagset[0];
                    const position = model.getPositionAt(diagnostic.start);
                    
                    const error = new EvalError(diagnostic.messageText);
                    error.lineNumber = position.lineNumber;
                    error.columnNumber = position.column;
                    throw error;
                }
            });

            const output = result.outputFiles[0].text;
            const stub = "var createScene = function() { return Playground.CreateScene(engine, engine.getRenderingCanvas()); }";

            return output + stub;
        }
    };
};