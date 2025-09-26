import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { Utilities } from "../../../tools/utilities";

/**
 *
 */
export class EditorHost {
    private _editor!: editor.IStandaloneCodeEditor;
    private _host!: HTMLDivElement;
    private _onScroll?: (vs: editor.ICodeEditorViewState) => void;

    get editor() {
        return this._editor;
    }
    get host() {
        return this._host;
    }

    create(host: HTMLDivElement, lang: "javascript" | "typescript") {
        this._host = host;
        if (this._editor) {
            this._editor.dispose();
        }

        const editorOptions: editor.IStandaloneEditorConstructionOptions = {
            value: "",
            language: lang,
            lineNumbers: "on",
            roundedSelection: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            occurrencesHighlight: "off",
            selectionHighlight: false,
            readOnly: false,
            theme: Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "vs-dark" : "vs-light",
            contextmenu: false,
            folding: true,
            showFoldingControls: "always",
            fontSize: parseInt(Utilities.ReadStringFromStore("font-size", "14")),
            minimap: { enabled: Utilities.ReadBoolFromStore("minimap", true) },
            definitionLinkOpensInPeek: true,
            multiCursorModifier: "alt",
            gotoLocation: {
                multiple: "peek",
                multipleDefinitions: "peek",
                multipleDeclarations: "peek",
                multipleImplementations: "peek",
                multipleTypeDefinitions: "peek",
                multipleReferences: "peek",
            },
        };
        this._editor = monaco.editor.create(host, editorOptions as any);

        this._editor.onDidScrollChange(() => {
            if (!this._onScroll) {
                return;
            }
            const vs = this._editor.saveViewState();
            if (vs) {
                this._onScroll(vs);
            }
        });
    }

    onScroll(cb: (vs: editor.ICodeEditorViewState) => void) {
        this._onScroll = cb;
    }

    updateOptions(opts: editor.IStandaloneEditorConstructionOptions) {
        this._editor?.updateOptions(opts);
    }

    dispose() {
        this.editor?.dispose();
        this._editor?.dispose();
        this._onScroll = undefined;
    }
}
