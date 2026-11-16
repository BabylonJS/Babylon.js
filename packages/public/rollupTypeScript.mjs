import ts from "typescript";
import { dirname, resolve } from "node:path";

/**
 * Share TypeScript emit across the sequential entries of one production Rollup invocation.
 * The compiler program is released before bundling; only emitted code and maps are retained.
 */
export function createTypeScriptEmitPlugins(tsconfig) {
    let outputs;
    return () => ({
        name: "shared-typescript-emit",
        buildStart() {
            if (outputs) {
                return;
            }
            const configPath = resolve(tsconfig);
            const config = ts.readConfigFile(configPath, ts.sys.readFile);
            if (config.error) {
                this.error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
            }
            const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath), {
                outDir: undefined,
                declaration: false,
                declarationMap: false,
                incremental: false,
                composite: false,
                tsBuildInfoFile: undefined,
                noEmit: false,
                emitDeclarationOnly: false,
                noEmitHelpers: true,
                importHelpers: true,
                sourceMap: true,
                inlineSources: true,
            });
            const program = ts.createProgram(parsed.fileNames, parsed.options);
            if (this.meta?.watchMode) {
                for (const source of program.getSourceFiles()) {
                    this.addWatchFile(source.fileName);
                }
            }
            const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
            if (diagnostics.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) {
                this.error(
                    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
                        getCanonicalFileName: (file) => file,
                        getCurrentDirectory: () => process.cwd(),
                        getNewLine: () => "\n",
                    })
                );
            }
            const emitted = new Map();
            const result = program.emit(undefined, (fileName, text, _bom, _error, sourceFiles) => {
                if (sourceFiles?.length !== 1) {
                    return;
                }
                const id = resolve(sourceFiles[0].fileName);
                const output = emitted.get(id) || {};
                if (fileName.endsWith(".js.map")) {
                    const map = JSON.parse(text);
                    map.sources = map.sources.map((source) => resolve(dirname(fileName), map.sourceRoot || "", source));
                    map.sourceRoot = "";
                    output.map = map;
                } else if (fileName.endsWith(".js")) {
                    output.code = text.replace(/\n?\/\/# sourceMappingURL=.*(?:\r?\n)?$/, "\n");
                }
                emitted.set(id, output);
            });
            if (result.emitSkipped) {
                this.error("TypeScript did not emit the production bundle inputs");
            }
            outputs = emitted;
        },
        load(id) {
            return outputs?.get(resolve(id)) || null;
        },
        watchChange() {
            outputs = undefined;
        },
    });
}
