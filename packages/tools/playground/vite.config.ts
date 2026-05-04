import { defineConfig } from "vite";
import path from "path";
import svgr from "vite-plugin-svgr";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration, babylonDevExternalsPlugin } from "../../public/viteToolsHelper.mjs";

// ---------------------------------------------------------------------------
// Monaco main-thread bundle
// ---------------------------------------------------------------------------
// Monaco editor has ~1100 individual ESM files. `optimizeDeps.include` can't
// help here because the dep optimizer also scans @dev/core dist files which
// contain bare `core/...` specifiers the optimizer can't resolve.
//
// Instead: intercept ALL `monaco-editor/*` imports via resolveId and return
// a single pre-built ESM virtual module. The module is built once by esbuild
// (the same bundler used for the Monaco worker shims) and cached for the
// lifetime of the dev server.
//
// editor.main.js (not editor.api.js) is used because it registers language
// support — including `typescript` which source files import via:
//   import { typescript } from "monaco-editor"
// Color/HSLA are Monaco-internal utilities needed by defaultDocumentColorsComputer.
const VIRTUAL_MONACO_ID = "\0virtual:monaco-main";
let _monacoMainPromise: Promise<string> | null = null;

function getMonacoMainBundle(): Promise<string> {
    if (!_monacoMainPromise) {
        _monacoMainPromise = import("esbuild").then(({ build }) =>
            build({
                stdin: {
                    contents: ['export * from "monaco-editor/esm/vs/editor/editor.main.js";', 'export { Color, HSLA } from "monaco-editor/esm/vs/base/common/color.js";'].join(
                        "\n"
                    ),
                    resolveDir: process.cwd(),
                    loader: "js",
                },
                bundle: true,
                write: false,
                format: "esm",
                platform: "browser",
                minify: false,
                // Monaco imports many CSS files from JS. Inject each one as a <style> tag
                // so Monaco's editor layout, cursors, and decorations render correctly.
                // (Passing CSS through esbuild without write:true/outdir would discard it.)
                plugins: [
                    {
                        name: "inject-monaco-css",
                        setup(build) {
                            build.onResolve({ filter: /\.css$/ }, (args) => ({
                                path: path.resolve(args.resolveDir, args.path),
                                namespace: "inject-css",
                            }));
                            build.onLoad({ filter: /.*/, namespace: "inject-css" }, async (args) => {
                                const fs = await import("fs/promises");
                                let css = await fs.readFile(args.path, "utf-8");
                                // Rewrite relative url() references so they resolve correctly when
                                // the CSS is injected as a <style> tag (the browser would otherwise
                                // resolve them against the page root, not the CSS file's directory).
                                const cssDir = path.dirname(args.path);
                                const isProduction = process.env.NODE_ENV === "production" || process.argv.includes("build");
                                // In production, pre-read referenced assets for data URI inlining
                                // (/@fs/ paths only work with the Vite dev server).
                                const assetCache: Record<string, string> = {};
                                if (isProduction) {
                                    const urlRefs = [...css.matchAll(/url\(\s*['"]?(?!data:|https?:|\/)([^'")]+)['"]?\s*\)/g)];
                                    for (const m of urlRefs) {
                                        const abs = path.resolve(cssDir, m[1]);
                                        if (!assetCache[abs]) {
                                            try {
                                                const data = await fs.readFile(abs);
                                                const ext = path.extname(abs).toLowerCase();
                                                const mime =
                                                    ext === ".ttf"
                                                        ? "font/ttf"
                                                        : ext === ".woff"
                                                          ? "font/woff"
                                                          : ext === ".woff2"
                                                            ? "font/woff2"
                                                            : ext === ".svg"
                                                              ? "image/svg+xml"
                                                              : ext === ".png"
                                                                ? "image/png"
                                                                : "application/octet-stream";
                                                assetCache[abs] = `data:${mime};base64,${data.toString("base64")}`;
                                            } catch {
                                                // Fall through to dev-mode path
                                            }
                                        }
                                    }
                                }
                                css = css.replace(/url\(\s*(['"]?)(?!data:|https?:|\/)(.*?)\1\s*\)/g, (_match, quote, ref) => {
                                    const abs = path.resolve(cssDir, ref);
                                    if (assetCache[abs]) {
                                        return `url(${quote}${assetCache[abs]}${quote})`;
                                    }
                                    return `url(${quote}/@fs${abs}${quote})`;
                                });
                                return {
                                    contents: `const __s=document.createElement('style');__s.textContent=${JSON.stringify(css)};document.head.appendChild(__s);`,
                                    loader: "js",
                                };
                            });
                        },
                    },
                ],
            }).then((r) => r.outputFiles[0].text)
        );
    }
    return _monacoMainPromise;
}
// ---------------------------------------------------------------------------

const base = commonDevViteConfiguration({
    port: parseInt(process.env.PLAYGROUND_PORT ?? "1338"),
    aliases: {
        // shared-ui-components is used by React components in this package (source-level).
        // Babylon packages (core/*, @dev/core) are NOT aliased here — they are handled by
        // babylonDevExternalsPlugin below, which rewrites all their imports to globalThis.BABYLON
        // accesses, exactly as webpack's `externals: { "@dev/core": "BABYLON" }` did.
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
    },
    productionExternals: {
        babylonjs: "BABYLON",
        "babylonjs-inspector": "BABYLON.Inspector",
    },
});

export default defineConfig({
    ...base,
    plugins: [
        // Spread base plugins first — includes react() and cssModuleNamespaceInteropPlugin.
        ...(base.plugins ?? []),
        // Replicate webpack `externals: { "@dev/core": "BABYLON" }` for Vite.
        // Rewrites all `import { X } from "@dev/core"` and `import { X } from "core/..."` to
        // `const { X } = globalThis.BABYLON ?? {}` so no ESM requests are made for those
        // packages. sharedUiComponents/src also imports from "core/..." so both must be mapped.
        babylonDevExternalsPlugin({ "@dev/core": "BABYLON", core: "BABYLON" }),
        svgr({
            include: "**/*.svg",
            svgrOptions: {
                plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
                svgoConfig: {
                    plugins: [{ name: "prefixIds" }],
                },
            },
        }),
        {
            // Bundles the Monaco main-thread library into a single ESM virtual module.
            // Without this, Vite serves each of the ~1100 monaco-editor/esm/* files
            // individually via /@fs/ requests.
            //
            // resolveId intercepts every `monaco-editor` / `monaco-editor/…` import from
            // source files and redirects it to the same virtual module ID. load() builds
            // the bundle once with esbuild, then serves the cached result for all callers.
            name: "monaco-esm-bundle",
            enforce: "pre",
            resolveId(id: string) {
                // Let typescriptServices resolve normally — it exports the
                // full TS compiler (including transpileModule) which the
                // snippetLoader needs at runtime for TS playground compilation.
                if (id.includes("typescriptServices")) {
                    return null;
                }
                if (id === "monaco-editor" || id.startsWith("monaco-editor/")) {
                    return VIRTUAL_MONACO_ID;
                }
                return undefined;
            },
            async load(id: string) {
                if (id !== VIRTUAL_MONACO_ID) return null;
                return getMonacoMainBundle();
            },
            // During production build, Rollup/Vite's vite:worker-import-meta-url plugin
            // intercepts `new Worker(new URL("*.worker.js", import.meta.url))` and tries
            // to resolve the worker entry module relative to the virtual module — which
            // fails because the virtual module has no real filesystem path.
            //
            // Replace each such instantiation with a no-op stub object so Rollup never sees
            // the import.meta.url worker pattern. Monaco degrades gracefully (no background
            // language services) but basic editing and syntax highlighting continue to work.
            transform(code: string, id: string) {
                if (id !== VIRTUAL_MONACO_ID) return null;
                const noopWorker = `new (class { postMessage() {} addEventListener() {} removeEventListener() {} terminate() {} onmessage = null; })()`;
                const stubbed = code.replace(/new Worker\s*\(\s*new URL\s*\([^)]+,\s*import\.meta\.url\s*\)[^)]*\)/g, noopWorker);
                return stubbed !== code ? { code: stubbed, map: null } : null;
            },
        },
        {
            // Bundles Monaco workers into single IIFEs using esbuild (Vite's own bundler).
            // `?worker` imports in Vite DEV mode create module workers that still crawl every
            // monaco-editor/esm/* file, causing 1000+ requests. This middleware builds each
            // worker once, caches it, and serves it as a pre-bundled classic Worker script.
            name: "monaco-worker-bundle",
            async configureServer(server) {
                const { build } = await import("esbuild");
                const cache: Record<string, string> = {};
                const entries: Record<string, string> = {
                    editor: "monaco-editor/esm/vs/editor/editor.worker.js",
                    ts: "monaco-editor/esm/vs/language/typescript/ts.worker.js",
                };
                server.middlewares.use(async (req: any, res: any, next: any) => {
                    const match = req.url?.match(/^\/__monaco-worker-(editor|ts)\.js$/);
                    if (!match) {
                        next();
                        return;
                    }
                    const name = match[1] as "editor" | "ts";
                    if (!cache[name]) {
                        const result = await build({
                            entryPoints: [entries[name]],
                            bundle: true,
                            write: false,
                            format: "iife",
                            platform: "browser",
                            minify: false,
                        });
                        cache[name] = result.outputFiles[0].text;
                    }
                    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                    res.end(cache[name]);
                });
            },
        },
        {
            // Builds Monaco workers as separate IIFE bundles and emits them into dist/
            // so the production build has working language services (autocomplete, etc.).
            // monacoWorkerSetup.ts points MonacoEnvironment.getWorkerUrl to these files.
            name: "monaco-worker-production",
            apply: "build" as const,
            async generateBundle() {
                const { build } = await import("esbuild");
                const entries: Record<string, string> = {
                    "editor.worker": "monaco-editor/esm/vs/editor/editor.worker.js",
                    "ts.worker": "monaco-editor/esm/vs/language/typescript/ts.worker.js",
                };
                for (const [name, entry] of Object.entries(entries)) {
                    const result = await build({
                        entryPoints: [entry],
                        bundle: true,
                        write: false,
                        format: "iife",
                        platform: "browser",
                        minify: true,
                    });
                    this.emitFile({
                        type: "asset",
                        fileName: `${name}.js`,
                        source: result.outputFiles[0].text,
                    });
                }
            },
        },
        {
            // Serves /babylon.playground.js — a shim replacing the webpack-built UMD bundle.
            //
            // Architecture: public/index.js (full CDN bootstrap) auto-detects localhost and
            // loads all babylon bundles from babylonServer (port 1337). After bundles load it
            // fetches /babylon.playground.js then calls BABYLON.Playground.Show(). In webpack
            // mode that file is the compiled bundle registering Playground on window.BABYLON.
            // In Vite dev mode the React app is served as ES modules; this shim captures the
            // Show() call and relays it to main.ts via a CustomEvent.
            name: "playground-dev-shims",
            configureServer(server) {
                server.middlewares.use("/babylon.playground.js", (_req, res) => {
                    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                    res.end(`(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) { return; }
    BABYLON.Playground = {
        Show: function (hostElement, mode, version, bundles) {
            var args = [hostElement, mode, version, bundles];
            window.__vitePlaygroundArgs = args;
            window.dispatchEvent(new CustomEvent("babylonPlaygroundReady", { detail: { args: args } }));
        }
    };
})();`);
                });
            },
        },
    ],
    resolve: {
        ...base.resolve,
    },
    build: {
        ...base.build,
        rollupOptions: {
            ...base.build?.rollupOptions,
            input: {
                index: path.resolve(__dirname, "index.html"),
                debug: path.resolve(__dirname, "debug.html"),
                frame: path.resolve(__dirname, "frame.html"),
                full: path.resolve(__dirname, "full.html"),
            },
            output: {
                ...((base.build?.rollupOptions?.output as object) ?? {}),
                // Put the Monaco virtual module into its own chunk so that the
                // browser's ESM loader guarantees Monaco is fully initialized
                // before the app chunk that uses it.
                //
                // Without this, Rollup inlines the esbuild-built Monaco bundle into
                // the main chunk. The esbuild output uses a k()-based lazy-init
                // system; when inlined, Rollup's module ordering can place code that
                // extends Monaco classes before Monaco's own var assignments run,
                // causing "X is not a constructor" TDZ errors at runtime.
                manualChunks(id: string) {
                    if (id === "\0virtual:monaco-main") {
                        return "monaco";
                    }
                    return undefined;
                },
            },
        },
    },
    optimizeDeps: {
        ...base.optimizeDeps,
        exclude: [...(base.optimizeDeps?.exclude ?? []), "monaco-editor", "babylonjs-gltf2interface", "@dev/core", "core"],
    },
    server: {
        ...base.server,
        fs: {
            allow: [path.resolve(__dirname, "../../..")],
        },
        warmup: {
            clientFiles: ["./src/main.ts", "./src/playground.tsx", "./src/globalState.ts"],
        },
    },
});
