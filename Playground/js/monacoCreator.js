/**
 * This JS file is for Monaco management
 * This file is quite technical, please make sure that you understand all parts before making changes.
 * Please also make sure that the following is still working before submitting a PR:
 * - autocompletion.
 * - deprecated members marking.
 * - compilation and proper error reporting for both JS and TS.
 * - private/internal member filtering (we should not see members starting with an underscore).
 * - dedicated adornments, like the one used for previewing colors for BABYLON.ColorX types.
 * - diff support.
 * - minimap support.
 */
class MonacoCreator {
    constructor(parent) {
        this.parent = parent;

        this.jsEditor = null;
        this.diffEditor = null;
        this.diffNavigator = null;
        this.monacoMode = "javascript";
        this.blockEditorChange = false;
        this.definitionWorker = null;
        this.deprecatedCandidates = [];
        this.templates = [];

        this.compilerTriggerTimeoutID = null;

        this.addOnMonacoLoadedCallback(
            function () {
                this.parent.main.run();

                // Register a global observable for inspector to request code changes
                window.Playground = {
                    onRequestCodeChangeObservable: new BABYLON.Observable()
                }

                window.Playground.onRequestCodeChangeObservable.add((options) => {
                    let code = this.getCode();
                    code = code.replace(options.regex, options.replace);

                    this.setCode(code);
                });
            },
            this
        );
    }

    // ACCESSORS

    get JsEditor() {
        return this.jsEditor;
    };

    getCode() {
        if (this.jsEditor) return this.jsEditor.getValue();
        else return "";
    };
    setCode(value) {
        this.jsEditor.setValue(value);
    };

    get MonacoMode() {
        return this.monacoMode;
    };
    set MonacoMode(mode) {
        if (this.monacoMode != "javascript" &&
            this.monacoMode != "typescript")
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

    waitForDefine() {
        return new Promise(function (resolve, reject) {
            function timeout() {
                if (!window.define) {
                    setTimeout(timeout, 200);
                } else {
                    resolve();
                }
            }
            timeout();
        });
    }

    /**
     * Load the Monaco Node module.
     */
    async loadMonaco(typings) {
        await this.waitForDefine();
        let response = await fetch(typings || "https://preview.babylonjs.com/babylon.d.ts");
        if (!response.ok) {
            return;
        }

        let libContent = await response.text();

        if (!typings) {
            response = await fetch(typings || "https://preview.babylonjs.com/gui/babylon.gui.d.ts");
            if (!response.ok) {
                return;
            }

            libContent += await response.text();
        }

        this.setupDefinitionWorker(libContent);

        // Load code templates
        response = await fetch("/templates.json");
        if (response.ok) {
            this.templates = await response.json();
        }

        // WARNING !!! We need the 'dev' version of Monaco, as we use monkey-patching to hook into the suggestion adapter
        require.config({
            paths: {
                'vs': '/node_modules/monaco-editor/dev/vs'
            }
        });

        require(['vs/editor/editor.main'], () => {
            // Setup the Monaco compilation pipeline, so we can reuse it directly for our scrpting needs
            this.setupMonacoCompilationPipeline(libContent);

            // This is used for a vscode-like color preview for ColorX types
            this.setupMonacoColorProvider();

            // enhance templates with extra properties
            for (const template of this.templates) {
                template.kind = monaco.languages.CompletionItemKind.Snippet,
                template.sortText = "!" + template.label; // make sure templates are on top of the completion window
                template.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            }

            // As explained above, we need the 'dev' version of Monaco to access this adapter!
            require(['vs/language/typescript/languageFeatures'], module => {
                this.hookMonacoCompletionProvider(module.SuggestAdapter);
            });

            this.onMonacoLoaded();
        });
    };

    onMonacoLoaded() {
        if (this.monacoLoaded) {
            return;
        }
        this.onMonacoLoadedCallbacks.forEach((callbackDef) => {
            callbackDef.func.call(callbackDef.context, this);
        });
        this.monacoLoaded = true;
    }

    /**
     * This will register a new callback that will be triggered when the monaco loader is done.
     * If the loader is already done, the function will be executed right away. 
     * @param {Function} func the function to call when monaco is available
     * @param {*} context The context of this function
     */
    addOnMonacoLoadedCallback(func, context) {
        this.onMonacoLoadedCallbacks = this.onMonacoLoadedCallbacks || [];
        if (this.monacoLoaded) {
            func.call(context, this);
        } else {
            this.onMonacoLoadedCallbacks.push({
                func: func,
                context: context
            });
        }
    }

    // > This worker will analyze the syntaxtree and return an array of deprecated functions (but the goal is to do more in the future!)
    // We need to do this because:
    // - checking extended properties during completion is time consuming, so we need to prefilter potential candidates
    // - we don't want to maintain a static list of deprecated members or to instrument this work on the CI
    // - we have more plans involving syntaxtree analysis
    // > This worker was carefully crafted to work even if the processing is super fast or super long. 
    // In both cases the deprecation filter will start working after the worker is done.
    // We will also need this worker in the future to compute Intellicode scores for completion using dedicated attributes.
    setupDefinitionWorker(libContent) {
        this.definitionWorker = new Worker('/js/definitionWorker.js');
        this.definitionWorker.addEventListener('message', ({
            data
        }) => {
            this.deprecatedCandidates = data.result;
            this.analyzeCode();
        });
        this.definitionWorker.postMessage({
            code: libContent
        });
    }

    isDeprecatedEntry(details) {
        return details &&
            details.tags &&
            details.tags.find(this.isDeprecatedTag);
    }

    isDeprecatedTag(tag) {
        return tag &&
            tag.name == "deprecated";
    }

    // This will make sure that all members marked with a deprecated jsdoc attribute will be marked as such in Monaco UI
    // We use a prefiltered list of deprecated candidates, because the effective call to getCompletionEntryDetails is slow.
    // @see setupDefinitionWorker
    async analyzeCode() {
        // if the definition worker is very fast, this can be called out of context. @see setupDefinitionWorker
        if (!this.jsEditor)
            return;

        const model = this.jsEditor.getModel();
        if (!model)
            return;

        const uri = model.uri;

        let worker = null;
        if (this.parent.settingsPG.ScriptLanguage == "JS")
            worker = await monaco.languages.typescript.getJavaScriptWorker();
        else
            worker = await monaco.languages.typescript.getTypeScriptWorker();

        const languageService = await worker(uri);
        const source = '[deprecated members]';

        monaco.editor.setModelMarkers(model, source, []);
        const markers = [];

        for (const candidate of this.deprecatedCandidates) {
            const matches = model.findMatches(candidate, null, false, true, null, false);
            for (const match of matches) {
                const position = {
                    lineNumber: match.range.startLineNumber,
                    column: match.range.startColumn
                };
                const wordInfo = model.getWordAtPosition(position);
                const offset = model.getOffsetAt(position);

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

    // This is our hook in the Monaco suggest adapter, we are called everytime a completion UI is displayed
    // So we need to be super fast.
    // We need the 'dev' version of Monaco, as we use monkey-patching to hook into this suggestion adapter
    hookMonacoCompletionProvider(provider) {
        const provideCompletionItems = provider.prototype.provideCompletionItems;
        const owner = this;

        provider.prototype.provideCompletionItems = async function (model, position, context, token) {
            // reuse 'this' to preserve context through call (using apply)
            const result = await provideCompletionItems.apply(this, [model, position, context, token]);

            if (!result || !result.suggestions)
                return result;

            const suggestions = result.suggestions.filter(item => !item.label.startsWith("_"));

            for (const suggestion of suggestions) {
                if (owner.deprecatedCandidates.includes(suggestion.label)) {

                    // the following is time consuming on all suggestions, that's why we precompute deprecated candidate names in the definition worker to filter calls
                    // @see setupDefinitionWorker
                    const uri = suggestion.uri;
                    const worker = await this._worker(uri);
                    const model = monaco.editor.getModel(uri);
                    const details = await worker.getCompletionEntryDetails(uri.toString(), model.getOffsetAt(position), suggestion.label)

                    if (owner.isDeprecatedEntry(details)) {
                        suggestion.tags = [monaco.languages.CompletionItemTag.Deprecated];
                    }
                }
            }

            // add our own templates when invoked without context
            if (context.triggerKind == monaco.languages.CompletionTriggerKind.Invoke) {
                for (const template of owner.templates) {
                    if (template.language && owner.monacoMode != template.language)
                        continue;

                    template.range = undefined;
                    suggestions.push(template);
                }
            }

            // preserve incomplete flag or force it when the definition is not yet analyzed
            const incomplete = (result.incomplete && result.incomplete == true) || owner.deprecatedCandidates.length == 0;

            return {
                suggestions: suggestions,
                incomplete: incomplete
            };
        }
    }

    // Setup both JS and TS compilation pipelines to work with our scripts. 
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

    // Provide an adornment for BABYLON.ColorX types: color preview
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

                return [{
                    label: label
                }];
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
                    range: {
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
        var editorElement = document.getElementById('jsEditor');
        editorElement.innerHTML = "";
        editorElement.style.overflow = "unset";
        this.jsEditor = monaco.editor.create(editorElement, editorOptions);
        this.jsEditor.setValue(oldCode);

        // We cannot call 'analyzeCode' on every keystroke, that's time consuming
        // So use a debounced version to prevent over processing.
        // Be careful to keep the proper context for the effective call (this).
        const analyzeCodeDebounced = this.parent.utils.debounceAsync((async) => this.analyzeCode(), 500);

        this.jsEditor.onDidChangeModelContent(function () {
            this.parent.utils.markDirty();
            analyzeCodeDebounced();
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

        this.diffEditor.addCommand(monaco.KeyCode.Escape, function () {
            main.toggleDiffEditor(monacoCreator, menuPG);
        });
        // Adding default VSCode bindinds for previous/next difference
        this.diffEditor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.F5, function () {
            main.navigateToNext();
        });
        this.diffEditor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.F5, function () {
            main.navigateToPrevious();
        });

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
    formatCode() {
        this.jsEditor.getAction('editor.action.formatDocument').run();
    };

    /**
     * Toggle the minimap
     */
    toggleMinimap() {
        var minimapToggle = document.getElementById("minimapToggle1280");
        if (minimapToggle.classList.contains('checked')) {
            this.jsEditor.updateOptions({
                minimap: {
                    enabled: false
                }
            });
            this.parent.utils.setToMultipleID("minimapToggle", "innerHTML", 'Minimap <i class="fa fa-square" aria-hidden="true"></i>');
        } else {
            this.jsEditor.updateOptions({
                minimap: {
                    enabled: true
                }
            });
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

            diagnostics.forEach(function (diagset) {
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