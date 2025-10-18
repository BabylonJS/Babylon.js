/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-await-in-loop */

import type { GlobalState } from "../globalState";
import { Logger } from "@dev/core";
import type { V2Manifest } from "./snippet";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let JSZip: any;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare let saveAs: (blob: Blob, name: string) => void;

type V2PackSnapshot = {
    manifest: V2Manifest;
    cdnBase: string;
    entryPathJs: string; // normalized to .js by the runner
    rewritten: Record<string, string>; // code as-run (imports currently __pg__/... blobs)
    importMap: Record<string, string>; // bare imports -> CDN URLs
    usedBareImports: readonly string[];
};

export class DownloadManager {
    public constructor(public globalState: GlobalState) {}

    private async _loadEsbuildAsync(): Promise<any> {
        let esbuild: any;
        try {
            // Use importShim to load the ESM module from URL
            const module = await (window as any).importShim("https://unpkg.com/esbuild-wasm@0.21.5/esm/browser.js");
            esbuild = module.default || module;

            if (!esbuild) {
                throw new Error("esbuild not found in imported module");
            }
        } catch (error) {
            throw new Error(`Could not load esbuild: ${error}`);
        }
        if (!(esbuild as any).__pgInit) {
            await esbuild.initialize({
                wasmURL: "https://unpkg.com/esbuild-wasm@0.21.5/esbuild.wasm",
                worker: true,
            });
            (esbuild as any).__pgInit = true;
        }
        return esbuild;
    }
    private async _bundleWithEsbuildAsync(snap: V2PackSnapshot): Promise<string> {
        const esbuild = await this._loadEsbuildAsync();
        if (!esbuild) {
            throw new Error("Esbuild failed to load");
        }

        const pathMapping: Record<string, string> = {};

        for (const [originalPath] of Object.entries(snap.manifest.files)) {
            const normalizedPath = originalPath.replace(/[.]tsx?$/i, ".js");

            pathMapping[`__pg__/${normalizedPath}`] = originalPath;
            pathMapping[normalizedPath] = originalPath;
        }

        const entry = snap.entryPathJs;
        const entrySpec = `__pg__/${entry}`;

        const snapshotPlugin = {
            name: "snapshot-loader",
            setup(build: any) {
                build.onResolve({ filter: /^__pg__\// }, (args: any) => {
                    const normalizedPath = args.path.slice(7); // remove __pg__/ prefix
                    const actualPath = pathMapping[args.path] || pathMapping[normalizedPath];

                    if (!actualPath) {
                        return { path: normalizedPath, namespace: "snapshot" };
                    }

                    return { path: actualPath, namespace: "snapshot" };
                });

                build.onLoad({ filter: /.*/, namespace: "snapshot" }, (args: any) => {
                    args.path = args.path.split("?")[0];
                    const code = snap.rewritten[args.path];
                    if (!code) {
                        return { errors: [{ text: `Missing rewritten module: ${args.path}` }] };
                    }

                    const ext = (args.path.match(/[.][^.]+$/)?.[0] || "").toLowerCase();
                    const loader = ext === ".ts" ? "js" : "js";

                    return {
                        contents: code,
                        loader,
                        resolveDir: "/",
                    };
                });
            },
        };

        const cdnPlugin = {
            name: "cdn-loader",
            setup(build: any) {
                const cache = new Map<string, string>();
                const importMap = snap.importMap || {};

                // Resolve bare imports to CDN URLs from importMap
                build.onResolve({ filter: /^[^./]/ }, (args: any) => {
                    // Skip if it's already a URL
                    if (/^https?:\/\//i.test(args.path)) {
                        return null;
                    }

                    // Use the importMap to resolve bare imports
                    const resolvedUrl = importMap[args.path];
                    if (resolvedUrl) {
                        return { path: resolvedUrl, namespace: "cdn" };
                    }

                    // Fallback to esm.sh if not in importMap
                    return { path: `https://esm.sh/${args.path}`, namespace: "cdn" };
                });

                // Handle relative URLs within CDN packages
                build.onResolve({ filter: /.*/, namespace: "cdn" }, (args: any) => {
                    if (/^https?:\/\//i.test(args.path)) {
                        return { path: args.path, namespace: "cdn" };
                    }
                    // Rebase relative imports within CDN packages
                    const url = new URL(args.path, args.importer);
                    return { path: url.href, namespace: "cdn" };
                });

                // Load CDN modules
                build.onLoad({ filter: /.*/, namespace: "cdn" }, async (args: any) => {
                    if (cache.has(args.path)) {
                        return { contents: cache.get(args.path)!, loader: "js" };
                    }

                    try {
                        const res = await fetch(args.path);
                        if (!res.ok) {
                            return { errors: [{ text: `HTTP ${res.status} ${args.path}` }] };
                        }
                        const text = await res.text();
                        cache.set(args.path, text);
                        return { contents: text, loader: "js" };
                    } catch (error) {
                        return { errors: [{ text: `Failed to fetch ${args.path}: ${error}` }] };
                    }
                });
            },
        };

        const result = await esbuild.build({
            entryPoints: [entrySpec],
            bundle: true,
            format: "esm",
            platform: "browser",
            target: ["es2020"],
            plugins: [snapshotPlugin, cdnPlugin],
            write: false,
            sourcemap: "inline",
            logLevel: "info",
        });

        if (result.errors && result.errors.length > 0) {
            throw new Error(`Build failed: ${result.errors.map((e: any) => e.text).join(", ")}`);
        }

        const output = result.outputFiles?.[0]?.text;
        if (!output) {
            throw new Error("No output generated by esbuild");
        }

        return output;
    }

    private _buildSingleFileHtmlFromBundle(bundleCode: string, title = "Babylon.js Playground") {
        const codeLiteral = JSON.stringify(bundleCode); // safely embed
        return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>

  <!-- Babylon globals (kept so window.BABYLON is available if your app expects it) -->
  <script src="https://assets.babylonjs.com/generated/Assets.js"></script>
  <script src="https://cdn.babylonjs.com/recast.js"></script>
  <script src="https://cdn.babylonjs.com/ammo.js"></script>
  <script src="https://cdn.babylonjs.com/havok/HavokPhysics_umd.js"></script>
  <script src="https://cdn.babylonjs.com/cannon.js"></script>
  <script src="https://cdn.babylonjs.com/Oimo.js"></script>
  <script src="https://cdn.babylonjs.com/earcut.min.js"></script>
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <script src="https://cdn.babylonjs.com/materialsLibrary/babylonjs.materials.min.js"></script>
  <script src="https://cdn.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js"></script>
  <script src="https://cdn.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js"></script>
  <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.js"></script>
  <script src="https://cdn.babylonjs.com/serializers/babylonjs.serializers.min.js"></script>
  <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
  <script src="https://cdn.babylonjs.com/addons/babylonjs.addons.min.js"></script>
  <script src="https://cdn.babylonjs.com/inspector/babylon.inspector.bundle.js"></script>

  <style>
    html,body,#renderCanvas{width:100%;height:100%;margin:0;padding:0;overflow:hidden;background:#000}
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <script type="module">
    // Turn bundle text into a module URL
    const code = ${codeLiteral};
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);

    const BABYLON = window.BABYLON;
    const canvas = document.getElementById('renderCanvas');

    // Import your bundled app (which exports createScene / default)
    const mod = await import(url);

    let engine = null;
    if (typeof mod.createEngine === 'function') {
      try { engine = await mod.createEngine(); } catch {}
    }
    if (!engine) {
      engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    }
    window.engine = engine; window.canvas = canvas;

    let createScene = mod.createScene || mod.default;
    if (!createScene && mod.Playground?.CreateScene) createScene = (e,c)=>mod.Playground.CreateScene(e,c);
    if (!createScene) throw new Error('No createScene() export found.');

    const scene = await (createScene(engine, canvas) ?? createScene());
    engine.runRenderLoop(()=>scene.render());
    addEventListener('resize', ()=>engine.resize());

    addEventListener('unload', ()=> URL.revokeObjectURL(url));
  </script>
</body>
</html>`;
    }

    /**
     * Produces a zip with a single self-contained index.html.
     * - All local modules are compiled with esbuild with source maps inlined.
     * - Bare deps use CDN from the runner snapshot (no asset inlining/patching).
     */
    public async downloadAsync() {
        this.globalState.onDisplayWaitRingObservable.notifyObservers(true);
        try {
            const runner = await this.globalState.getRunnable();
            const snap = runner.getPackSnapshot?.() as V2PackSnapshot | null;
            if (!snap) {
                throw new Error("No pack snapshot available. Please run the scene once before downloading.");
            }

            const bundleCode = await this._bundleWithEsbuildAsync(snap);
            if (!bundleCode) {
                throw new Error("Bundling produced no output.");
            }

            const html = this._buildSingleFileHtmlFromBundle(bundleCode, "Babylon.js Playground");

            const zip = new JSZip();
            zip.file("index.html", html);
            const blob: Blob = await zip.generate({ type: "blob" });
            saveAs(blob, "playground-bundled.zip");
        } catch (e) {
            Logger.Warn(`Download failed: ${(e as Error)?.message || e}`);
            this.globalState.onErrorObservable.notifyObservers({
                message: String((e as Error)?.message || e),
                lineNumber: 0,
                columnNumber: 0,
            } as any);
        } finally {
            this.globalState.onDisplayWaitRingObservable.notifyObservers(false);
        }
    }
}
