/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-await-in-loop */

import type { GlobalState } from "../globalState";
import { Logger } from "@dev/core";
import * as lexer from "es-module-lexer";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let JSZip: any;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare let saveAs: (blob: Blob, name: string) => void;

type V2PackSnapshot = {
    manifest: {
        v: 2;
        language: "JS" | "TS";
        entry: string;
        imports: Record<string, string>;
        files: Record<string, string>;
        cdnBase?: string;
    };
    cdnBase: string;
    entryPathJs: string; // normalized to .js by the runner
    rewritten: Record<string, string>; // code as-run (imports currently __pg__/... blobs)
    importMap: Record<string, string>; // bare imports -> CDN URLs
    usedBareImports: readonly string[];
};

export class DownloadManager {
    public constructor(public globalState: GlobalState) {}

    // ---------- utils ----------
    private _ensureJsExt(p: string) {
        if (/[.](m?js)$/i.test(p)) {
            return p;
        }
        if (/[.]tsx?$/i.test(p)) {
            return p.replace(/[.]tsx?$/i, ".js");
        }
        if (/[.](wgsl|glsl|fx)$/i.test(p)) {
            return p + ".js";
        } // shader wrappers
        return p.endsWith("/") ? p + "index.js" : p + ".js";
    }

    private _b64(s: string) {
        // UTF-8 safe base64
        return btoa(unescape(encodeURIComponent(s)));
    }

    private _toDataUrl(code: string, mime = "text/javascript") {
        return `data:${mime};charset=utf-8;base64,${this._b64(code)}`;
    }

    private _rewriteImportsToLocalSpecs(snap: V2PackSnapshot, srcDir = "src"): Record<string, { spec: string; code: string }> {
        const out: Record<string, { spec: string; code: string }> = {};
        const { parse } = lexer;

        for (const [path, code] of Object.entries(snap.rewritten)) {
            const canonicalSelf = `./${srcDir}/${this._ensureJsExt(path)}`;
            const [imports] = parse(code);
            if (!imports.length) {
                out[path] = { spec: canonicalSelf, code };
                continue;
            }

            let rebuilt = "";
            let last = 0;

            for (const im of imports) {
                const s = (im as any).s,
                    e = (im as any).e;
                const spec = (im as any).n as string | undefined;
                if (!spec) {
                    continue;
                }

                let replacement = spec;

                // __pg__/foo/bar.ts?v=...  ->  ./src/foo/bar.js
                const m = /^__pg__\/(.+?)(?:\?.*)?$/i.exec(spec);
                if (m) {
                    const originalPath = m[1]; // e.g. "foo/bar.ts" or "shaders/thing.wgsl"
                    replacement = `./${srcDir}/${this._ensureJsExt(originalPath)}`;
                } else if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/")) {
                    // Rewrite any relative/absolute project import to the canonical ./src/... form
                    // We can't resolve filesystem here, but the runner already flattened to __pg__ for locals.
                    // For safety, force a .js extension so the browser can import it via the map.
                    replacement = spec;
                    if (!/[.](m?js)$/i.test(replacement) && !/[.]tsx?$/i.test(replacement) && !/[.](wgsl|glsl|fx)$/i.test(replacement)) {
                        replacement = replacement.endsWith("/") ? replacement + "index.js" : replacement + ".js";
                    }
                    // Prefix "./src" if not already (make it canonical across all modules)
                    if (!replacement.startsWith(`./${srcDir}/`)) {
                        const trimmed = replacement.replace(/^\.\//, "").replace(/^\//, "");
                        replacement = `./${srcDir}/${trimmed}`;
                    }
                } else {
                    // bare or remote: leave as-is (resolved by snap.importMap or network)
                    replacement = spec;
                }

                rebuilt += code.slice(last, s) + replacement;
                last = e;
            }

            rebuilt += code.slice(last);
            out[path] = { spec: canonicalSelf, code: rebuilt };
        }

        return out;
    }

    private _buildSingleFileHtml(transformed: Record<string, { spec: string; code: string }>, snap: V2PackSnapshot, title = "Babylon.js Playground", srcDir = "src") {
        // Build import map: all local canonical specs -> data: URLs
        const imports: Record<string, string> = { ...(snap.importMap || {}) };
        for (const { spec, code } of Object.values(transformed)) {
            imports[spec] = this._toDataUrl(code, "text/javascript");
        }
        // ensure babylonjs exists if user didn't include it in imports (most have it)
        if (!imports["babylonjs"]) {
            imports["babylonjs"] = "https://esm.sh/babylonjs@latest";
        }

        const entrySpec = `./${srcDir}/${this._ensureJsExt(snap.entryPathJs)}`;
        const importMapJson = JSON.stringify({ imports }, null, 2);

        return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
<!-- Babylon.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.6.2/dat.gui.min.js"></script>
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
  <script async src="https://cdn.jsdelivr.net/npm/es-module-shims@2.6.2/dist/es-module-shims.js"></script>
  <script type="importmap">
${importMapJson}
  </script>
  <style>
    html,body,#renderCanvas{width:100%;height:100%;margin:0;padding:0;overflow:hidden;background:#000}
  </style>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <script type="module">
    const BABYLON = window.BABYLON;
    const canvas = document.getElementById('renderCanvas');

    // import the user's entry module (resolved via import map -> data: URL)
    const mod = await import(${JSON.stringify(entrySpec)});

    // optional createEngine; else default
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
  </script>
</body>
</html>`;
    }

    // ---------- public API ----------
    /**
     * Produces a zip with a single self-contained index.html.
     * - All local modules are embedded as data: URLs via import map.
     * - Bare deps use CDN from the runner snapshot (no asset inlining/patching).
     */
    public async downloadAsync() {
        this.globalState.onDisplayWaitRingObservable.notifyObservers(true);
        try {
            await lexer.init;

            const runner = await this.globalState.getRunnable();
            const snap = runner.getPackSnapshot?.() as V2PackSnapshot | null;
            if (!snap) {
                throw new Error("No pack snapshot available. Please run the scene once before downloading.");
            }

            // Rewrite imports to canonical ./src/... specs (so map matches even from data: URL modules)
            const transformed = this._rewriteImportsToLocalSpecs(snap, "src");

            // Build single-file HTML
            const html = this._buildSingleFileHtml(transformed, snap, "Babylon.js Playground", "src");

            // Zip with just index.html
            const zip = new JSZip();
            zip.file("index.html", html);
            const blob: Blob = await zip.generate({ type: "blob" });
            saveAs(blob, "playground-esm.zip");
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
