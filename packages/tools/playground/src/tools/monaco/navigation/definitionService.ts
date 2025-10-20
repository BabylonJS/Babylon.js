import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { FilesManager } from "../files/filesManager";
import { ImportIndexService } from "./importIndexService";

/**
 * Provides cross-module definition and reference support for Monaco editor
 */
export class DefinitionService {
    private _disposables: monaco.IDisposable[] = [];
    private _definitionWorker?: Worker;
    private _importIndex = new ImportIndexService();

    constructor(
        private _files: FilesManager,
        private _switchFile?: (path: string) => void
    ) {}

    dispose() {
        this._disposables.forEach((d) => d.dispose());
        this._disposables = [];
        this._definitionWorker?.terminate();
    }

    /**
     * Install the cross-module definition provider and cmd+click override
     */
    installProvider() {
        this._disposables.forEach((d) => d.dispose());
        this._disposables = [];

        // Wire cmd+click override for better navigation
        this._wireCmdClickOverride();

        // Definition provider for cross-file navigation
        const defProvider = monaco.languages.registerDefinitionProvider(["typescript", "javascript"], {
            // eslint-disable-next-line
            provideDefinition: async (model, position) => {
                const word = model.getWordAtPosition(position);
                if (!word) {
                    return [];
                }

                const imports = this._findImportsInModel(model);
                for (const imp of imports) {
                    if (this._isPositionInRange(position, imp.range)) {
                        const targetPath = this._resolveImportPath(model.uri.path, imp.spec);
                        const targetModel = this._files.getModel(targetPath);
                        if (targetModel) {
                            return [
                                {
                                    uri: targetModel.uri,
                                    range: new monaco.Range(1, 1, 1, 1),
                                },
                            ];
                        }
                    }

                    // Check if position is on an imported symbol
                    for (const entry of imp.entries) {
                        if (this._isPositionInRange(position, entry.range)) {
                            const targetPath = this._resolveImportPath(model.uri.path, imp.spec);
                            const targetModel = this._files.getModel(targetPath);
                            if (targetModel) {
                                const exportRange = this._findExportRangeInTarget(targetModel, targetPath, entry.imported, entry.isDefault);
                                if (exportRange) {
                                    return [
                                        {
                                            uri: targetModel.uri,
                                            range: exportRange,
                                        },
                                    ];
                                }
                            }
                        }
                    }
                }

                return [];
            },
        });

        this._disposables.push(defProvider);
    }

    /**
     * Wire cmd+click override for enhanced navigation
     */
    private _wireCmdClickOverride() {
        let pendingNav: { targetPath: string; destRange: monaco.Range } | null = null;

        const deferNav = (fn: () => void) => setTimeout(() => requestAnimationFrame(() => setTimeout(fn, 0)), 0);

        // Override cmd+click for imports navigation
        this._disposables.push(
            monaco.editor.onDidCreateEditor((editor) => {
                const mouseDown = editor.onMouseDown((e) => {
                    if (!e.event.leftButton) {
                        return;
                    }
                    const isCmd = e.event.metaKey || e.event.ctrlKey;
                    if (!isCmd) {
                        return;
                    }

                    const model = editor.getModel();
                    const pos = e.target.position;
                    if (!model || !pos) {
                        return;
                    }

                    e.event.preventDefault?.();
                    e.event.stopPropagation?.();

                    void (async () => {
                        try {
                            const hit = await this._importAtPositionAsync(model, pos);
                            if (!hit) {
                                pendingNav = null;
                                return;
                            }

                            const { spec, entries, isOnSpec, clickedBinding } = hit;
                            const isRelative = spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/");

                            // Only handle relative imports for now
                            if (!isRelative) {
                                pendingNav = null;
                                return;
                            }

                            const fromPath = model.uri.path.replace(/^[\\/]*pg[\\/]*/, "").replace(/\\/g, "/");
                            const targetPath = this._resolveRelativePath(fromPath, spec);

                            if (!targetPath || !this._files.has(targetPath)) {
                                pendingNav = null;
                                return;
                            }

                            const targetModel = this._files.getModel(targetPath);
                            if (!targetModel) {
                                pendingNav = null;
                                return;
                            }

                            let destRange: monaco.Range;
                            if (isOnSpec || entries.length === 0) {
                                destRange = new monaco.Range(1, 1, 1, 1);
                            } else {
                                const b = clickedBinding ?? entries[0];
                                destRange = this._findExportRangeInTarget(targetModel, targetPath, b.imported, b.isDefault) || new monaco.Range(1, 1, 1, 1);
                            }

                            pendingNav = { targetPath, destRange };
                        } catch {
                            pendingNav = null;
                        }
                    })();
                });

                const mouseUp = editor.onMouseUp((_e) => {
                    if (!pendingNav) {
                        return;
                    }

                    const { targetPath, destRange } = pendingNav;
                    pendingNav = null;

                    deferNav(() => {
                        if (!this._files.has(targetPath)) {
                            return;
                        }
                        // Use file switching callback if available, otherwise set model directly
                        if (this._switchFile) {
                            this._switchFile(targetPath);
                        } else {
                            const targetModel = this._files.getModel(targetPath);
                            if (targetModel && editor.getModel() !== targetModel) {
                                editor.setModel(targetModel);
                            }
                        }
                        editor.revealRangeInCenter(destRange, monaco.editor.ScrollType.Smooth);
                        editor.setPosition({ lineNumber: destRange.startLineNumber, column: destRange.startColumn });
                        editor.focus();
                    });
                });

                this._disposables.push(mouseDown, mouseUp);
            })
        );
    }

    private _findImportsInModel(model: monaco.editor.ITextModel) {
        const code = model.getValue();
        const imports: Array<{
            spec: string;
            range: monaco.Range;
            entries: Array<{
                imported: string;
                local: string;
                isDefault: boolean;
                range: monaco.Range;
            }>;
        }> = [];

        // Simple regex-based import parsing (could be enhanced with proper AST parsing)
        const importRegex = /import\s+([^'"]*?)\s+from\s+['"]([^'"]+)['"];?/g;
        let match;

        while ((match = importRegex.exec(code)) !== null) {
            const fullMatch = match[0];
            const importClause = match[1];
            const spec = match[2];

            const startPos = model.getPositionAt(match.index);
            const endPos = model.getPositionAt(match.index + fullMatch.length);
            const range = new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column);

            const entries = this._parseImportClause(model, importClause, match.index);

            imports.push({
                spec,
                range,
                entries,
            });
        }

        return imports;
    }

    private _parseImportClause(
        model: monaco.editor.ITextModel,
        clause: string,
        baseOffset: number
    ): Array<{
        imported: string;
        local: string;
        isDefault: boolean;
        range: monaco.Range;
    }> {
        const entries: Array<{
            imported: string;
            local: string;
            isDefault: boolean;
            range: monaco.Range;
        }> = [];

        // Default import: import Foo from ...
        const defaultMatch = clause.match(/^\s*(\w+)/);
        if (defaultMatch) {
            const name = defaultMatch[1];
            const startPos = model.getPositionAt(baseOffset + clause.indexOf(name));
            const endPos = model.getPositionAt(baseOffset + clause.indexOf(name) + name.length);
            entries.push({
                imported: "default",
                local: name,
                isDefault: true,
                range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
            });
        }

        // Named imports: import { a, b as c } from ...
        const namedMatch = clause.match(/\{([^}]+)\}/);
        if (namedMatch) {
            const namedImports = namedMatch[1];
            const imports = namedImports.split(",").map((s) => s.trim());

            for (const imp of imports) {
                const asMatch = imp.match(/(\w+)\s+as\s+(\w+)/);
                if (asMatch) {
                    const imported = asMatch[1];
                    const local = asMatch[2];
                    const startPos = model.getPositionAt(baseOffset + clause.indexOf(imported));
                    const endPos = model.getPositionAt(baseOffset + clause.indexOf(imported) + imported.length);
                    entries.push({
                        imported,
                        local,
                        isDefault: false,
                        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
                    });
                } else if (imp.match(/^\w+$/)) {
                    const name = imp;
                    const startPos = model.getPositionAt(baseOffset + clause.indexOf(name));
                    const endPos = model.getPositionAt(baseOffset + clause.indexOf(name) + name.length);
                    entries.push({
                        imported: name,
                        local: name,
                        isDefault: false,
                        range: new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
                    });
                }
            }
        }

        return entries;
    }

    private _resolveImportPath(fromPath: string, spec: string): string {
        if (spec.startsWith("./") || spec.startsWith("../")) {
            // Strip any leading pg/ or similar prefixes
            const cleanFromPath = fromPath.replace(/^[\\/]*pg[\\/]*/, "");
            const base = cleanFromPath.split("/").slice(0, -1);
            const parts = spec.split("/");

            for (const part of parts) {
                if (part === "..") {
                    base.pop();
                } else if (part !== ".") {
                    base.push(part);
                }
            }

            const resolved = base.join("/");

            // Use _pickActual to handle extension resolution
            return this._pickActual(resolved) || resolved;
        }

        return spec;
    }

    /**
     * Find import at specific position in model
     * @param model The Monaco text model
     * @param position The cursor position
     * @returns Import information if found
     */
    private async _importAtPositionAsync(model: monaco.editor.ITextModel, position: monaco.Position) {
        const imports = this._importIndex.indexImports(model);
        const pos = model.getOffsetAt(position);

        const hit = imports.find((imp) => {
            return pos >= imp.s && pos <= imp.e;
        });

        if (!hit) {
            return null;
        }

        const clickedBinding =
            hit.entries.find((e: any) => {
                const startPos = model.getOffsetAt(new monaco.Position(e.range.startLineNumber, e.range.startColumn));
                const endPos = model.getOffsetAt(new monaco.Position(e.range.endLineNumber, e.range.endColumn));
                return pos >= startPos && pos <= endPos;
            }) || null;

        // Check if click is on the import spec itself
        const specStart = model.getOffsetAt(new monaco.Position(hit.originSelectionRange.startLineNumber, hit.originSelectionRange.startColumn));
        const specEnd = model.getOffsetAt(new monaco.Position(hit.originSelectionRange.endLineNumber, hit.originSelectionRange.endColumn));
        const isOnSpec = pos >= specStart && pos <= specEnd;

        return { ...hit, clickedBinding, isOnSpec };
    }

    /**
     * Resolve relative import path
     * @param fromPath The source file path
     * @param relativePath The relative import path
     * @returns The resolved absolute path or null if not found
     */
    private _resolveRelativePath(fromPath: string, relativePath: string): string | null {
        // Strip any leading pg/ or similar prefixes
        const cleanFromPath = fromPath.replace(/^[\\/]*pg[\\/]*/, "");
        const fromParts = cleanFromPath.split("/");
        fromParts.pop(); // Remove filename

        const relParts = relativePath.split("/");
        const resolved = [...fromParts];

        for (const part of relParts) {
            if (part === "..") {
                resolved.pop();
            } else if (part !== "." && part !== "") {
                resolved.push(part);
            }
        }

        let targetPath = resolved.join("/");

        // If we resolved to an empty path, it means we're at the root
        if (!targetPath) {
            targetPath = relativePath.replace(/^\.\//, "");
        }

        // Use _pickActual to handle extension resolution
        return this._pickActual(targetPath);
    }

    private _isPositionInRange(position: monaco.Position, range: monaco.Range): boolean {
        return range.containsPosition(position);
    }

    private _findExportRangeInTarget(targetModel: monaco.editor.ITextModel, targetPath: string, name: string, wantDefault: boolean): monaco.Range | null {
        const code = targetModel.getValue();

        if (wantDefault) {
            // Look for export default
            const defaultExportRegex = /export\s+default\s+(?:function\s+)?(\w+)/;
            const match = defaultExportRegex.exec(code);
            if (match) {
                const pos = targetModel.getPositionAt(match.index + match[0].indexOf(match[1]));
                return new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column + match[1].length);
            }
        } else {
            // Look for named export
            const namedExportRegex = new RegExp(`export\\s+(?:function\\s+|class\\s+|const\\s+|let\\s+|var\\s+)?${name}\\b`);
            const match = namedExportRegex.exec(code);
            if (match) {
                const pos = targetModel.getPositionAt(match.index + match[0].indexOf(name));
                return new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column + name.length);
            }
        }

        return null;
    }

    private _pickActual(p: string): string | null {
        if (this._files.has(p)) {
            return p;
        }
        for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
            if (this._files.has(p + ext)) {
                return p + ext;
            }
        }
        return null;
    }
}
