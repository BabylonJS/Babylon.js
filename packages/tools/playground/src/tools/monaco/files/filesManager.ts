import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { MonacoLanguageFor } from "../utils/path";

/**
 *
 */
export class FilesManager {
    private _models = new Map<string, monaco.editor.ITextModel>();
    private _viewStates = new Map<string, editor.ICodeEditorViewState | null>();
    private _isDirty = false;

    constructor(private _getLangFallback: () => "javascript" | "typescript") {}

    get isDirty() {
        return this._isDirty;
    }
    setDirty(v: boolean) {
        this._isDirty = v;
    }

    has(path: string) {
        return this._models.has(path);
    }
    getModel(path: string) {
        return this._models.get(path);
    }
    paths() {
        return [...this._models.keys()];
    }

    getFiles(): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [p, m] of this._models) {
            out[p] = m.getValue();
        }
        return out;
    }

    setFiles(files: Record<string, string>, onContentChange: (path: string, code: string) => void) {
        // dispose removed
        for (const [p, m] of this._models) {
            if (!files[p]) {
                m.dispose();
                this._models.delete(p);
            }
        }

        const fallback = this._getLangFallback();
        for (const [path, code] of Object.entries(files)) {
            const existing = this._models.get(path);
            if (existing) {
                if (existing.getValue() !== code) {
                    existing.setValue(code);
                }
            } else {
                const uri = monaco.Uri.parse(`file:///pg/${path.replace(/^\//, "")}`);
                const model = monaco.editor.createModel(code, MonacoLanguageFor(path, fallback), uri);
                model.onDidChangeContent(() => {
                    onContentChange(path, model.getValue());
                    this._isDirty = true;
                });
                this._models.set(path, model);
            }
        }
    }

    addFile(path: string, initial: string, onContentChange: (path: string, code: string) => void) {
        if (this._models.has(path)) {
            return;
        }
        const fallback = this._getLangFallback();
        const uri = monaco.Uri.parse(`file:///pg/${path.replace(/^\//, "")}`);
        const model = monaco.editor.createModel(initial, MonacoLanguageFor(path, fallback), uri);
        model.onDidChangeContent(() => {
            onContentChange(path, model.getValue());
            this._isDirty = true;
        });
        this._models.set(path, model);
    }

    removeAllFiles() {
        for (const m of this._models.values()) {
            m.dispose();
        }
        this._models.clear();
        this._viewStates.clear();
        this._isDirty = false;
    }

    removeFile(path: string) {
        const m = this._models.get(path);
        if (m) {
            m.dispose();
            this._models.delete(path);
        }
        this._viewStates.delete(path);
    }

    renameFile(oldPath: string, newPath: string, onContentChange: (path: string, code: string) => void) {
        const model = this._models.get(oldPath);
        if (!model) {
            return false;
        }
        if (this._models.has(newPath)) {
            throw new Error("Target file already exists");
        }

        if (this._viewStates.has(oldPath)) {
            this._viewStates.set(newPath, this._viewStates.get(oldPath)!);
            this._viewStates.delete(oldPath);
        }

        const lang = model.getLanguageId();
        const value = model.getValue();
        const uri = monaco.Uri.parse(`file:///pg/${newPath.replace(/^\//, "")}`);
        const newModel = monaco.editor.createModel(value, lang, uri);
        newModel.onDidChangeContent(() => onContentChange(newPath, newModel.getValue()));
        this._models.set(newPath, newModel);
        this._models.delete(oldPath);
        model.dispose();
        return true;
    }

    saveViewState(path: string, vs: editor.ICodeEditorViewState | null) {
        this._viewStates.set(path, vs);
    }

    restoreViewState(path: string, editor: editor.IStandaloneCodeEditor) {
        const vs = this._viewStates.get(path);
        if (vs) {
            editor.restoreViewState(vs);
            editor.focus();
        } else {
            editor.setScrollTop(0);
        }
    }
    dispose() {
        this.removeAllFiles();
        this._models.clear();
        this._viewStates.clear();
    }
}
