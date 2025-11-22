// ts/tsPipeline.ts
import { typescript } from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

/**
 *
 */

const TsOptions: typescript.CompilerOptions = {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    module: typescript.ModuleKind.ESNext,
    moduleResolution: typescript.ModuleResolutionKind.NodeJs,
    resolvePackageJsonExports: true,
    resolvePackageJsonImports: true,
    target: typescript.ScriptTarget.ESNext,
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
    jsx: typescript.JsxEmit.ReactJSX,
    jsxFactory: "JSXAlone.createElement",
    lib: ["es2020", "dom", "dom.iterable"],
};

const JsOptions: typescript.CompilerOptions = {
    ...TsOptions,
    checkJs: false,
    noImplicitAny: false,
    allowJs: true,
    jsxFactory: "JSXAlone.createElement",
    jsx: typescript.JsxEmit.ReactJSX,
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

            typescript.typescriptDefaults.setCompilerOptions(options);
            typescript.javascriptDefaults.setCompilerOptions(jsOptions);

            typescript.typescriptDefaults.setEagerModelSync(true);
            typescript.javascriptDefaults.setEagerModelSync(true);

            this._setupDone = true;
        }

        if (libContent) {
            const tsDisposable = typescript.typescriptDefaults.addExtraLib(libContent, "file:///external/babylon.globals.d.ts");
            const jsDisposable = typescript.javascriptDefaults.addExtraLib(libContent, "file:///external/babylon.globals.d.ts");
            this._extraLibDisposables.push(tsDisposable, jsDisposable);
        }

        const shaderDts = `
declare module "*.wgsl" { const content: string; export default content; }
declare module "*.glsl" { const content: string; export default content; }
declare module "*.fx"   { const content: string; export default content; }`;
        const shaderTsDisposable = typescript.typescriptDefaults.addExtraLib(shaderDts, "file:///external/shaders.d.ts");
        const shaderJsDisposable = typescript.javascriptDefaults.addExtraLib(shaderDts, "file:///external/shaders.d.ts");
        this._extraLibDisposables.push(shaderTsDisposable, shaderJsDisposable);

        // Global shim for legacy PG with less strict checking
        this._addGlobalAnyStub();
    }
    addPathsFor(raw: string, canonical: string) {
        if (!raw || raw === canonical) {
            return;
        }
        this._paths[raw] = [canonical];

        typescript.typescriptDefaults.setCompilerOptions({
            ...TsOptions,
            paths: { ...this._paths },
        });
        typescript.javascriptDefaults.setCompilerOptions({
            ...JsOptions,
            paths: { ...this._paths },
        });
        typescript.typescriptDefaults.setDiagnosticsOptions({
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

        typescript.typescriptDefaults.addExtraLib(dts, uri);
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
        js: string;
        map?: string;
    }> {
        const clean = path.replace(/^\//, "");
        const uri = monaco.Uri.parse(`file:///pg/${clean}`);
        const wf = await typescript.getTypeScriptWorker();
        const svc = await wf(uri);
        const out = await svc.getEmitOutput(uri.toString());
        if (out.emitSkipped) {
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
        const ts = typescript;

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
    }
    private _workspaceDecls?: { ts: monaco.IDisposable; js: monaco.IDisposable };

    addWorkspaceFileDeclarations(_files: Record<string, string>) {
        if (this._workspaceDecls) {
            try {
                this._workspaceDecls.ts.dispose();
            } catch {}
            try {
                this._workspaceDecls.js.dispose();
            } catch {}
            this._workspaceDecls = undefined;
        }
        this.forceSyncModels();
    }

    private _addGlobalAnyStub() {
        const stub = `
/**
 *  Playground “any-variable” shim.
 *  Every identifier that is not found in the current program
 *  is treated as a global variable of type \`any\`.
 */
declare global {
    interface GlobalAny {
        [name: string]: any;
    }
    var globalThis: GlobalAny;
}
export {};
`;

        const uri = "file:///pg/__playground_any_shim.d.ts";

        if (!this._extraLibUris.has(uri)) {
            const disp = typescript.typescriptDefaults.addExtraLib(stub, uri);
            const dispJs = typescript.javascriptDefaults.addExtraLib(stub, uri);
            this._extraLibDisposables.push(disp);
            this._extraLibDisposables.push(dispJs);
            this._extraLibUris.add(uri);
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
