import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

const ImportLocalRe = /\bfrom\s+['"]([^'"]+@local(?:\/[^'"]*)?)['"]|^\s*import\s+['"]([^'"]+@local(?:\/[^'"]*)?)['"]/gm;

/**
 *
 */
export class CodeLensService {
    constructor(private _resolveOneLocalAsync: (fullSpec: string) => Promise<void>) {}
    private _disposables: monaco.IDisposable[] = [];
    private _langId(lang: "JS" | "TS"): "javascript" | "typescript" {
        return lang === "JS" ? "javascript" : "typescript";
    }
    register(lang: "JS" | "TS") {
        this._disposables.forEach((d) => d.dispose());
        const language = this._langId(lang);

        this._disposables.push(
            monaco.languages.registerCodeLensProvider(language, {
                provideCodeLenses: (model) => {
                    const code = model.getValue();
                    const lenses: monaco.languages.CodeLens[] = [];
                    let m: RegExpExecArray | null;
                    ImportLocalRe.lastIndex = 0;
                    while ((m = ImportLocalRe.exec(code))) {
                        const fullSpec = (m[1] || m[2])!;
                        const start = model.getPositionAt(m.index);
                        lenses.push({
                            range: new monaco.Range(start.lineNumber, 1, start.lineNumber, 1),
                            command: {
                                id: "pg.resolveLocalTypings.one",
                                title: `Resolve and start FS watch for local package for ${fullSpec}`,
                                tooltip: "Links a built local npm package to the Playground. Select the containing build/dist folder.",
                                arguments: [fullSpec],
                            },
                        });
                    }
                    return { lenses, dispose: () => {} };
                },
            })
        );

        this._disposables.push(
            monaco.editor.registerCommand("pg.resolveLocalTypings.one", async (_acc, fullSpec: string) => {
                await this._resolveOneLocalAsync(fullSpec);
            })
        );
    }
}
