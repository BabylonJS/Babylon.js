/**
 * This JS file is for Monaco management
 */
class MonacoCreator {
    constructor() {
        this.jsEditor = null;
        this.monacoMode = "javascript";
        this.blockEditorChange = false;
        
        this.loadMonaco();
    }

    // ACCESSORS

    get JsEditor() {
        return this.jsEditor;
    };

    get MonacoMode() {
        return this.monacoMode;
    };
    set MonacoMode(mode) {
        if(this.monacoMode != "javascript"
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
    loadMonaco() {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', "babylon.d.txt", true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });
                    require(['vs/editor/editor.main'], function () {
                        if (this.monacoMode === "javascript") {
                            monaco.languages.typescript.javascriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');
                        } else {
                            monaco.languages.typescript.typescriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');
                        }

                        run();
                    });
                }
            }
        };
        xhr.send(null);
    };

    /**
     * Function to (re)create the editor
     */
    createMonacoEditor() {
        var oldCode = "";
        if(this.jsEditor) {
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
            theme: settingsPG.vsTheme,
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
            utils.markDirty();
        });
    };
};