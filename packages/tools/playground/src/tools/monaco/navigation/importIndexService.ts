import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as lexer from "es-module-lexer";

lexer.initSync();
/**
 * Service for indexing and analyzing imports in Monaco models using es-module-lexer
 */
export class ImportIndexService {
    private _importIndexCache = new WeakMap<monaco.editor.ITextModel, { version: number; items: any[] }>();

    indexImports(model: monaco.editor.ITextModel) {
        const version = model.getVersionId();
        const cached = this._importIndexCache.get(model);
        if (cached && cached.version === version) {
            return cached.items;
        }

        const { parse } = lexer;
        const code = model.getValue();
        const [imports] = parse(code);

        // Normalize to objects with statement + spec + binding ranges
        const items = imports.map((im: any) => {
            const spec = im.n; // import specifier
            const clauseStart = im.s;
            const clauseEnd = im.e;

            // Parse clause to extract individual bindings
            const clause = code.slice(clauseStart, clauseEnd);
            const entries: Array<{
                imported: string;
                local: string;
                isDefault: boolean;
                range: monaco.Range;
            }> = [];

            // Get positions for the import statement
            const ss = model.getPositionAt(im.ss);
            const se = model.getPositionAt(im.se);
            const originSelectionRange = new monaco.Range(ss.lineNumber, ss.column, se.lineNumber, se.column);

            // Parse import bindings more accurately
            this._parseImportBindings(model, clause, clauseStart, entries);

            return {
                ss,
                se,
                s: im.s,
                e: im.e,
                spec,
                clauseStart,
                clauseEnd,
                entries,
                originSelectionRange,
            };
        });

        this._importIndexCache.set(model, { version, items });
        return items;
    }

    private _parseImportBindings(
        model: monaco.editor.ITextModel,
        clause: string,
        clauseStart: number,
        entries: Array<{
            imported: string;
            local: string;
            isDefault: boolean;
            range: monaco.Range;
        }>
    ) {
        // Default import
        const defaultMatch = /^\s*import\s+([A-Za-z_$][\w$]*)\s*(?:,|from\b|$)/.exec(clause);
        if (defaultMatch) {
            const local = defaultMatch[1];
            const startOffset = clauseStart + defaultMatch.index! + defaultMatch[0].indexOf(local);
            const endOffset = startOffset + local.length;
            const startPos = model.getPositionAt(startOffset);
            const endPos = model.getPositionAt(endOffset);

            entries.push({
                imported: "default",
                local,
                isDefault: true,
                range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
            });
        }

        // Namespace import
        const namespaceMatch = /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(clause);
        if (namespaceMatch) {
            const local = namespaceMatch[1];
            const startOffset = clauseStart + namespaceMatch.index! + namespaceMatch[0].indexOf(local);
            const endOffset = startOffset + local.length;
            const startPos = model.getPositionAt(startOffset);
            const endPos = model.getPositionAt(endOffset);

            entries.push({
                imported: "*",
                local,
                isDefault: false,
                range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
            });
        }

        // Named imports
        const namedMatch = /\{([\s\S]*?)\}/.exec(clause);
        if (namedMatch) {
            const inner = namedMatch[1];
            const innerStart = clauseStart + namedMatch.index! + 1;

            // Split by comma and parse each binding
            const bindings = inner
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            let currentOffset = innerStart;

            for (const binding of bindings) {
                const asMatch = binding.match(/([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)/);
                if (asMatch) {
                    const imported = asMatch[1];
                    const local = asMatch[2];
                    const bindingOffset = inner.indexOf(binding, currentOffset - innerStart);
                    const importedOffset = innerStart + bindingOffset + binding.indexOf(imported);
                    const importedEnd = importedOffset + imported.length;
                    const startPos = model.getPositionAt(importedOffset);
                    const endPos = model.getPositionAt(importedEnd);

                    entries.push({
                        imported,
                        local,
                        isDefault: false,
                        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
                    });
                } else {
                    const name = binding.trim();
                    if (name && /^[A-Za-z_$][\w$]*$/.test(name)) {
                        const bindingOffset = inner.indexOf(binding, currentOffset - innerStart);
                        const nameOffset = innerStart + bindingOffset + binding.indexOf(name);
                        const nameEnd = nameOffset + name.length;
                        const startPos = model.getPositionAt(nameOffset);
                        const endPos = model.getPositionAt(nameEnd);

                        entries.push({
                            imported: name,
                            local: name,
                            isDefault: false,
                            range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
                        });
                    }
                }

                currentOffset = innerStart + inner.indexOf(binding) + binding.length;
            }
        }
    }

    /**
     * Clear the import index cache
     */
    clearCache() {
        this._importIndexCache = new WeakMap();
    }
}
