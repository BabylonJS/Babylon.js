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
                        if (this.monacoMode === "javascript") {
                            monaco.languages.typescript.javascriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');
                        } else {
                            var typescript = monaco.languages.typescript;

                            typescript.typescriptDefaults.setCompilerOptions({
                                module: typescript.ModuleKind.AMD,
                                target: typescript.ScriptTarget.ES5,
                                noLib: true,
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
     * @param {Function} callBack : Function that will be called after retrieving the code.
     */
    getRunCode(callBack) {
        var parent = this.parent;

        if (parent.settingsPG.ScriptLanguage == "JS")
            callBack(this.jsEditor.getValue());
        else if (parent.settingsPG.ScriptLanguage == "TS") {
            var uri = this.jsEditor.getModel().uri;
            monaco.languages.typescript.getTypeScriptWorker()
            .then(function(worker) {
                worker(uri)
                .then(function(languageService) {
                    var uriStr = uri.toString();

                    Promise.all([languageService.getSyntacticDiagnostics(uriStr), languageService.getSemanticDiagnostics(uriStr)])
                    .then(function(diagnostics) {
                        diagnostics.forEach(function(diagset) {
                            if (diagset.length) {
                                parent.utils.showError(diagset[0].messageText);
                            }
                        });
                    });

                    languageService.getEmitOutput(uriStr)
                    .then(function(result) {
                        var output = result.outputFiles[0].text;
                        var stub = "var createScene = function() { return Playground.CreateScene(engine, engine.getRenderingCanvas()); }";
                        callBack(output + stub);
                    });
                });
            });
        }
    };
};