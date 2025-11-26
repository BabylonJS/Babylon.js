import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { TemplateItem } from "./templatesService";

/**
 *
 */
export class CompletionService {
    private _disposable: monaco.IDisposable | null = null;
    private _langId(lang: "JS" | "TS"): "javascript" | "typescript" {
        return lang === "JS" ? "javascript" : "typescript";
    }

    register(lang: "JS" | "TS", templates: TemplateItem[]) {
        this._disposable?.dispose();
        const language = this._langId(lang);

        this._disposable = monaco.languages.registerCompletionItemProvider(language, {
            // triggerCharacters: [".", '"', "'", "/", "@"],
            // eslint-disable-next-line
            provideCompletionItems: async (model, position, context) => {
                const word = model.getWordUntilPosition(position);

                const suggestions: monaco.languages.CompletionItem[] = [];

                for (const t of templates) {
                    if (t.label.toLowerCase().includes(word.word.toLowerCase()) || t.key.toLowerCase().includes(word.word.toLowerCase())) {
                        suggestions.push({
                            label: t.label,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: t.documentation,
                            insertText: t.insertText,
                            insertTextRules: t.insertTextRules,
                            sortText: t.sortText,
                            range: {
                                startLineNumber: position.lineNumber,
                                endLineNumber: position.lineNumber,
                                startColumn: word.startColumn,
                                endColumn: word.endColumn,
                            },
                        });
                    }
                }
                return { suggestions };
            },
        });
    }
}
