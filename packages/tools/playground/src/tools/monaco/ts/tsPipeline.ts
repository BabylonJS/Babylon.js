// ts/tsPipeline.ts
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { TsWorkerManager } from "./workerManager";

/**
 *
 */

const TsOptions: monaco.languages.typescript.CompilerOptions = {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    resolvePackageJsonExports: true,
    resolvePackageJsonImports: true,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    noEmit: false,
    allowNonTsExtensions: true,
    skipLibCheck: true,
    strict: false,
    baseUrl: "file:///pg/",
    typeRoots: [],
    isolatedModules: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: false,
    allowUmdGlobalAccess: true,
    inlineSourceMap: true,
    inlineSources: true,
    sourceRoot: "file:///pg/",
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    jsxFactory: "JSXAlone.createElement",
    lib: ["es2020", "dom", "dom.iterable"],
};

const JsOptions: monaco.languages.typescript.CompilerOptions = {
    ...TsOptions,
    checkJs: false,
    noImplicitAny: false,
    allowJs: true,
    jsxFactory: "JSXAlone.createElement",
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
};
/**
 *
 */
export class TsPipeline {
    private _paths: Record<string, string[]> = {};
    private _extraLibUris = new Set<string>();
    private _extraLibDisposables: monaco.IDisposable[] = [];
    private _setupDone = false;

    setup(libContent: string) {
        if (!this._setupDone) {
            const options = { ...TsOptions, paths: this._paths };
            const jsOptions = { ...JsOptions, paths: this._paths };

            monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions(jsOptions);

            monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
            monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

            this._setupDone = true;
        }

        if (libContent) {
            const tsDisposable = monaco.languages.typescript.typescriptDefaults.addExtraLib(libContent, "file:///external/babylon.globals.d.ts");
            const jsDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(libContent, "file:///external/babylon.globals.d.ts");
            this._extraLibDisposables.push(tsDisposable, jsDisposable);
        }

        const shaderDts = `
declare module "*.wgsl" { const content: string; export default content; }
declare module "*.glsl" { const content: string; export default content; }
declare module "*.fx"   { const content: string; export default content; }`;
        const shaderTsDisposable = monaco.languages.typescript.typescriptDefaults.addExtraLib(shaderDts, "file:///external/shaders.d.ts");
        const shaderJsDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(shaderDts, "file:///external/shaders.d.ts");
        this._extraLibDisposables.push(shaderTsDisposable, shaderJsDisposable);
    }
    addPathsFor(raw: string, canonical: string) {
        if (!raw || raw === canonical) {
            return;
        }
        this._paths[raw] = [canonical];

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            ...TsOptions,
            paths: { ...this._paths },
        });
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            ...JsOptions,
            paths: { ...this._paths },
        });
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false,
        });
    }

    addForwarder(raw: string, canonical: string) {
        if (!raw || raw === canonical) {
            return;
        }
        const uri = `file:///__pg__/forwarders/${encodeURIComponent(raw)}.d.ts`;
        if (this._extraLibUris.has(uri)) {
            return;
        }

        const dts = `declare module "${raw}" {` + ` export * from "${canonical}";` + ` export { default } from "${canonical}";` + `}\n`;

        monaco.languages.typescript.typescriptDefaults.addExtraLib(dts, uri);
        this._extraLibUris.add(uri);
    }

    ensureTsModel(path: string, code: string) {
        const clean = path.replace(/^\//, "");
        const uri = monaco.Uri.parse(`file:///pg/${clean}`);
        const existing = monaco.editor.getModel(uri);
        if (existing) {
            if (existing.getValue() !== code) {
                existing.setValue(code);
            }
            return existing;
        }
        return monaco.editor.createModel(code, "typescript", uri);
    }

    async emitOneAsync(path: string): Promise<{
        /**
         *
         */
        js: string /**
         *
         */;
        map?: string;
    }> {
        const clean = path.replace(/^\//, "");
        const uri = monaco.Uri.parse(`file:///pg/${clean}`);
        const wf = await TsWorkerManager.getWorkerAsync();
        const out = await wf.getEmitOutput(uri.toString());

        if (out.emitSkipped) {
            // Usually means noEmit was true or TS could not emit for this file
            throw new Error(`Emit skipped for ${clean}`);
        }

        const jsFile = out.outputFiles.find((f) => f.name.endsWith(".js"));
        if (!jsFile) {
            throw new Error(`No JS output for ${clean}`);
        }

        const mapFile = out.outputFiles.find((f) => f.name.endsWith(".js.map"));
        return { js: jsFile.text, map: mapFile?.text };
    }

    /**
     * Force sync models with TypeScript service for better import recognition
     */
    forceSyncModels() {
        // Ensure TypeScript service is aware of all models
        const ts = monaco.languages.typescript;

        // Force worker restart to pick up all models
        ts.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false,
        });

        ts.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false,
        });
        // Invalidate worker cache since diagnostic options changed
        TsWorkerManager.invalidateWorker();
    }

    addWorkspaceFileDeclarations(files: Record<string, string>) {
        let declarations = "";
        for (const [path, content] of Object.entries(files)) {
            const moduleName = path.replace(/\.(ts|tsx|js|jsx)$/, "");
            // For TypeScript files, extract exports
            if (path.endsWith(".ts") || path.endsWith(".tsx")) {
                // Basic export extraction - could be enhanced
                const exportMatches = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+(\w+)/g);
                if (exportMatches) {
                    declarations += `declare module "./${moduleName}" {\n`;
                    for (const match of exportMatches) {
                        const nameMatch = match.match(/(\w+)$/);
                        if (nameMatch) {
                            declarations += `  export const ${nameMatch[1]}: any;\n`;
                        }
                    }
                    declarations += `}\n`;
                }
            } else if (path.endsWith(".js") || path.endsWith(".jsx")) {
                // For JS files, assume exports exist
                declarations += `declare module "./${moduleName}" {\n`;
                declarations += `  const _default: any;\n`;
                declarations += `  export = _default;\n`;
                declarations += `}\n`;
            }
        }

        if (declarations) {
            const ts = monaco.languages.typescript;
            const tsDisposable = ts.typescriptDefaults.addExtraLib(declarations, "file:///external/workspace-declarations.d.ts");
            const jsDisposable = ts.javascriptDefaults.addExtraLib(declarations, "file:///external/workspace-declarations.d.ts");
            this._extraLibDisposables.push(tsDisposable, jsDisposable);
        }
    }

    dispose() {
        // Dispose all extra lib disposables
        for (const disposable of this._extraLibDisposables) {
            try {
                disposable.dispose();
            } catch {
                // Ignore errors during cleanup
            }
        }
        this._extraLibDisposables = [];
        this._extraLibUris.clear();
        this._paths = {};
        this._setupDone = false;
    }
}
