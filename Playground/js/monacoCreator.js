/**
 * This JS file is for Monaco management
 */
class MonacoCreator {
    constructor(parent) {
        this.parent = parent;
        
        this.jsEditor = null;
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
                        const typescript = monaco.languages.typescript;

                        if (this.monacoMode === "javascript") {
                            typescript.javascriptDefaults.setCompilerOptions({
                                noLib: false,
                                allowNonTsExtensions: true // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
                            });

                            typescript.javascriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');
                        } else {
                            typescript.typescriptDefaults.setCompilerOptions({
                                module: typescript.ModuleKind.AMD,
                                target: typescript.ScriptTarget.ES5,
                                noLib: false,
                                noResolve: true,
                                suppressOutputPathCheck: true,

                                allowNonTsExtensions: true // required to prevent Uncaught Error: Could not find file: 'inmemory://model/1'.
                            });
                            typescript.typescriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');
                        }

                        this.parent.main.run();
                    }.bind(this));
                }
            }
        }.bind(this);
        xhr.send(null);
    };

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
                    var diagnostic = diagset[0];
                    var position = model.getPositionAt(diagnostic.start);
                    
                    throw new Error(`Line ${position.lineNumber}:${position.column} - ${diagnostic.messageText}`);
                }
            });

            const output = result.outputFiles[0].text;
            const stub = "var createScene = function() { return Playground.CreateScene(engine, engine.getRenderingCanvas()); }";

            return output + stub;
        }
    };
};