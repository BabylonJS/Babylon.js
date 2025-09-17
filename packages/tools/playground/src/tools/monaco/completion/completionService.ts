import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { TemplateItem } from "./templatesService";
import type { TagCandidate } from "../analysis/codeAnalysisService";
import { GetWorkerForModel } from "../worker/worker";

/**
 *
 */
export class CompletionService {
    private _disposable: monaco.IDisposable | null = null;
    private _tagCandidates: TagCandidate[] | undefined;

    setTagCandidates(v: TagCandidate[] | undefined) {
        this._tagCandidates = v;
    }

    private _langId(lang: "JS" | "TS"): "javascript" | "typescript" {
        return lang === "JS" ? "javascript" : "typescript";
    }

    private _tsKindToMonaco(kind: string): monaco.languages.CompletionItemKind {
        switch (kind) {
            case "method":
                return monaco.languages.CompletionItemKind.Method;
            case "function":
                return monaco.languages.CompletionItemKind.Function;
            case "constructor":
                return monaco.languages.CompletionItemKind.Constructor;
            case "field":
                return monaco.languages.CompletionItemKind.Field;
            case "variable":
                return monaco.languages.CompletionItemKind.Variable;
            case "class":
                return monaco.languages.CompletionItemKind.Class;
            case "interface":
                return monaco.languages.CompletionItemKind.Interface;
            case "module":
                return monaco.languages.CompletionItemKind.Module;
            case "property":
                return monaco.languages.CompletionItemKind.Property;
            case "enum":
                return monaco.languages.CompletionItemKind.Enum;
            case "keyword":
                return monaco.languages.CompletionItemKind.Keyword;
            case "snippet":
                return monaco.languages.CompletionItemKind.Snippet;
            default:
                return monaco.languages.CompletionItemKind.Text;
        }
    }

    private _shouldDecorateLabel = (label: string) => {
        return this._tagCandidates?.some((t) => t.name === label);
    };

    register(lang: "JS" | "TS", templates: TemplateItem[]) {
        this._disposable?.dispose();
        const language = this._langId(lang);
        this._disposable = monaco.languages.registerCompletionItemProvider(language, {
            triggerCharacters: [".", '"', "'", "/", "@"],
            // eslint-disable-next-line
            provideCompletionItems: async (model, position, context) => {
                const svc = await GetWorkerForModel(model);
                const offset = model.getOffsetAt(position);
                const info = await svc.getCompletionsAtPosition(model.uri.toString(), offset);

                const word = model.getWordUntilPosition(position);
                const replaceRange = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

                const suggestions: monaco.languages.CompletionItem[] = [];
                for (const e of info?.entries ?? []) {
                    if (e.name?.startsWith("_")) {
                        continue;
                    }
                    suggestions.push({
                        label: e.name,
                        kind: this._tsKindToMonaco(e.kind),
                        sortText: e.sortText ?? e.name,
                        filterText: e.insertText ?? e.name,
                        insertText: e.insertText ?? e.name,
                        range: replaceRange,
                        // eslint-disable-next-line
                        ...({ __uri: model.uri.toString(), __offset: offset, __source: e.source } as any),
                    });
                }

                if (context.triggerKind === monaco.languages.CompletionTriggerKind.Invoke) {
                    const tmpl = templates.filter((t) => !t.language || t.language === language).map((t) => ({ ...t, range: replaceRange }));
                    suggestions.push(...(tmpl as any));
                }
                const incomplete = !!info?.isIncomplete || (this._tagCandidates?.length ?? 0) === 0;
                return { suggestions, incomplete };
            },
            // eslint-disable-next-line
            resolveCompletionItem: async (item) => {
                try {
                    const model = monaco.editor.getModels()[0];
                    if (!model) {
                        return item;
                    }
                    const uriStr = (item as any).__uri ?? model.uri.toString();
                    if (!uriStr) {
                        return item;
                    }
                    const svc = await GetWorkerForModel(model);
                    let offset: number | undefined = (item as any).__offset;
                    if (offset == null && item.range) {
                        const m = monaco.editor.getModel(monaco.Uri.parse(uriStr));
                        if (m && (item as any).range?.startLineNumber) {
                            const r = item.range as monaco.IRange;
                            offset = m.getOffsetAt(new monaco.Position(r.startLineNumber, r.startColumn));
                        }
                    }
                    if (offset == null) {
                        return item;
                    }

                    const labelStr = typeof item.label === "string" ? item.label : item.label.label;
                    const shouldDecorate = this._shouldDecorateLabel(labelStr);
                    if (!shouldDecorate) {
                        return item;
                    }

                    const details = await svc.getCompletionEntryDetails(uriStr, offset, labelStr);
                    const candidate = this._tagCandidates?.find((t) => t.name === labelStr);
                    const hit = (details as any)?.tags?.find((t: any) => t.name === candidate?.tagName);
                    if (hit) {
                        (item as any).label = labelStr + " ⚠️";
                    }
                } catch {}
                return item;
            },
        });
    }
}
