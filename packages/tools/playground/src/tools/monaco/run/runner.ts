/* eslint-disable no-await-in-loop */
/* eslint-disable jsdoc/require-jsdoc */

import type { ThinEngine, Scene } from "@dev/core";
import type * as monacoNs from "monaco-editor/esm/vs/editor/editor.api";
import * as lexer from "es-module-lexer";
import type { TsPipeline } from "../ts/tsPipeline";

lexer.initSync();

export type V2Manifest = {
    v: 2;
    language: "JS" | "TS";
    entry: string;
    imports: Record<string, string>;
    files: Record<string, string>;
    cdnBase?: string;
};

export type RuntimeDeps = {
    autoProbe?: boolean;
    enable?: Partial<Record<"ammo" | "recast" | "havok" | "sound" | "toolkit", boolean>>;
    urls?: Partial<{
        ammo: string; // e.g. "https://cdn.babylonjs.com/ammo/ammo.js"
        recast: string; // e.g. "https://cdn.babylonjs.com/recast.js"
        havok: string; // e.g. "https://cdn.babylonjs.com/havok/HavokPhysics.js"
        toolkit: string; // default BabylonToolkit URL
    }>;
    allowScriptInjection?: boolean;
};

export type V2RunnerOptions = {
    monaco: typeof import("monaco-editor/esm/vs/editor/editor.api");
    createModelsIfMissing?: boolean;
    onDiagnosticError?: (err: { path: string; message: string; line: number; column: number }) => void;
    importMapId?: string; // default: "pg-v2-import-map"
    runtime?: RuntimeDeps;
};

export type V2Runner = {
    run(engine: ThinEngine, canvas: HTMLCanvasElement): Promise<Scene>;
    dispose(): void;
};

export async function CreateV2Runner(manifest: V2Manifest, opts: V2RunnerOptions, pipeline: TsPipeline): Promise<V2Runner> {
    const ts = {};
    const monaco = opts.monaco as typeof monacoNs;
    const importMapId = opts.importMapId || "pg-v2-import-map";
    const runNonce = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const specKey = (p: string) => `__pg__/${p}?v=${runNonce}`;

    // ---------- 0) tiny utils ----------
    const loadScriptOnce = (() => {
        const seen = new Set<string>();
        return async (url: string) =>
            await new Promise<void>((res, rej) => {
                if (seen.has(url)) {
                    return res();
                }
                const s = document.createElement("script");
                s.src = url;
                s.async = true;
                s.onload = () => {
                    seen.add(url);
                    res();
                };
                s.onerror = () => rej(new Error(`Failed to load ${url}`));
                document.head.appendChild(s);
            });
    })();

    async function ensureImportShim() {
        if ((window as any).importShim) {
            return;
        }
        await loadScriptOnce("https://cdn.jsdelivr.net/npm/es-module-shims@2.6.2/dist/es-module-shims.js");
    }

    // ---------- 1) DIAGNOSTICS (Monaco TS worker) ----------
    // Ensure Monaco models exist for every TS/TSX file so diagnostics work.
    const tsPaths = Object.keys(manifest.files).filter((p) => /[.]tsx?$/i.test(p));
    if (tsPaths.length) {
        const ensureModel = (path: string, code: string) => {
            // Try to find an existing model by suffix match (path equality) first
            const existing = monaco.editor.getModels().find((m) => m.uri.path.endsWith("/" + path));
            if (existing) {
                if (existing.getValue() !== code) {
                    existing.setValue(code);
                }
                return existing;
            }
            if (opts.createModelsIfMissing !== false) {
                const lang = path.endsWith(".tsx") ? "typescript" : "typescript";
                const uri = monaco.Uri.parse(`file:///pg/${path.replace(/^\//, "")}`);
                return monaco.editor.createModel(code, lang, uri);
            }
            return null;
        };

        for (const p of tsPaths) {
            ensureModel(p, manifest.files[p]);
        }

        const worker = await monaco.languages.typescript.getTypeScriptWorker();
        // Map every ts/tsx model to diagnostics
        for (const model of monaco.editor.getModels().filter((m) => /[.]tsx?$/.test(m.uri.path))) {
            const svc = await worker(model.uri);
            const uriStr = model.uri.toString();
            const [syn, sem] = await Promise.all([svc.getSyntacticDiagnostics(uriStr), svc.getSemanticDiagnostics(uriStr)]);
            const first = [...syn, ...sem][0];
            if (first) {
                const pos = model.getPositionAt(first.start ?? 0);
                const errObj = {
                    path: model.uri.path.split("/pg/")[1] || model.uri.path,
                    message: String(first.messageText),
                    line: pos.lineNumber,
                    column: pos.column,
                };
                if (opts.onDiagnosticError) {
                    opts.onDiagnosticError(errObj);
                    // throw new Error("Aborted run due to diagnostics.");
                } else {
                    const e = new Error(`${errObj.path}:${errObj.line}:${errObj.column} ${errObj.message}`);
                    (e as any).__pgDiag = errObj;
                    throw e;
                }
            }
        }
    }

    const cdnBase = String(manifest.cdnBase || "https://esm.sh/");
    const cdnUrl = (spec: string) => {
        if (cdnBase.includes("esm.sh")) {
            return cdnBase.replace(/\/$/, "") + "/" + spec;
        }
        if (cdnBase.includes("cdn.jsdelivr.net")) {
            return cdnBase.replace(/\/$/, "") + "/" + spec + "/+esm";
        }
        return cdnBase.replace(/\/$/, "") + "/" + spec;
    };

    const resolveRelative = (fromPath: string, rel: string) => {
        const base = fromPath.split("/");
        base.pop();
        const segs = rel.split("/");
        for (const s of segs) {
            if (!s || s === ".") {
                continue;
            }
            if (s === "..") {
                base.pop();
            } else {
                base.push(s);
            }
        }
        return base.join("/");
    };

    const known = new Set(Object.keys(manifest.files));
    const pickActual = (p: string) =>
        known.has(p) ? p : known.has(p + ".ts") ? p + ".ts" : known.has(p + ".tsx") ? p + ".tsx" : known.has(p + ".js") ? p + ".js" : known.has(p + ".mjs") ? p + ".mjs" : null;
    const normalizeEntry = (p: string) => {
        const clean = p.replace(/^\//, "");
        // pickActual prefers .ts/.tsx/.js/.mjs in that order
        return pickActual(clean) ?? clean;
    };
    const defaultEntry = manifest.language === "TS" ? "index.ts" : "index.js";
    const entryPath = normalizeEntry(manifest.entry || defaultEntry);

    const compiled: Record<string, string> = {};

    function hasCreateSceneDecl(code: string) {
        const fnDecl = /\bfunction\s+createScene\s*\(/;
        const fnExpr = /\b(?:var|let|const)\s+createScene\s*=\s*(?:async\s*)?function\b/;
        const arrow = /\b(?:var|let|const)\s+createScene\s*=\s*[^=]*=>/;
        return fnDecl.test(code) || fnExpr.test(code) || arrow.test(code);
    }
    function ensureExports(path: string, code: string) {
        if (path === manifest.entry) {
            const hasExportedCreate =
                /\bexport\s+function\s+createScene\b/.test(code) || /\bexport\s*\{[^}]*\bcreateScene\b[^}]*\}/.test(code) || /\bexport\s+default\b/.test(code);
            if (hasCreateSceneDecl(code) && !hasExportedCreate) {
                code += " export { createScene };";
            }
            const hasPlay = /\bclass\s+Playground\b/.test(code);
            const hasExportedPlay = /\bexport\s+class\s+Playground\b/.test(code) || /\bexport\s*\{[^}]*\bPlayground\b[^}]*\}/.test(code);
            if (hasPlay && !hasExportedPlay) {
                code += " export { Playground };";
            }
        }
        return code;
    }

    // Phase 1: per-file transpile (TS->JS) and shader wrapping
    for (const [path, src] of Object.entries(manifest.files)) {
        if (/[.](wgsl|glsl|fx)$/i.test(path)) {
            compiled[path] = `export default ${JSON.stringify(src)};`;
            continue;
        }
        let code = ensureExports(path, src);
        if (/[.]tsx?$/i.test(path) && ts) {
            code = (await pipeline.emitOneAsync(path)).js;
        } else {
            code += `\n//# sourceURL=file:///pg/${path}`;
        }
        compiled[path] = code;
    }

    // Phase 2: rewrite imports to local spec keys or CDN
    const { parse } = lexer;
    const rewritten: Record<string, string> = {};

    function normalizeForCdn(spec: string) {
        if (spec.startsWith("npm:") || spec.startsWith("pkg:")) {
            return spec.replace(/^npm:|^pkg:/, "");
        }
        return spec;
    }
    for (const [path, code] of Object.entries(compiled)) {
        const [imports] = parse(code);
        if (!imports.length) {
            rewritten[path] = code;
            continue;
        }

        let out = "";
        let last = 0;

        for (const im of imports) {
            const spec = (im as any).n as string | undefined;
            if (!spec) {
                continue;
            } // skip non-static or unsupported cases

            const isRel = spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/");
            let replacement = spec;

            if (isRel) {
                const target = pickActual(resolveRelative(path, spec).replace(/\\/g, "/"));
                if (target) {
                    replacement = specKey(target);
                }
            } else {
                const normalized = normalizeForCdn(spec);
                replacement = manifest.imports?.[spec] ?? manifest.imports?.[normalized] ?? cdnUrl(normalized);
            }

            out += code.slice(last, (im as any).s) + replacement;
            last = (im as any).e;
        }

        out += code.slice(last);
        rewritten[path] = out;
    }

    // Phase 3: Build import map and blob URLs
    const blobUrls: string[] = [];
    const imports: Record<string, string> = { ...(manifest.imports || {}) };
    for (const [path, code] of Object.entries(rewritten)) {
        const spec = specKey(path);
        const blob = new Blob([code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        blobUrls.push(url);
        imports[spec] = url;
    }
    // Phase 4: Install/replace import map; store blobs in data attribute for safe cleanup later
    const prev = document.getElementById(importMapId) as HTMLScriptElement | null;
    if (prev?.dataset.urls) {
        try {
            for (const u of JSON.parse(prev.dataset.urls)) {
                URL.revokeObjectURL(u);
            }
        } catch {}
    }
    prev?.remove();

    const importMapEl = document.createElement("script");
    importMapEl.type = "importmap-shim";
    importMapEl.id = importMapId;
    importMapEl.textContent = JSON.stringify({ imports });
    importMapEl.dataset.urls = JSON.stringify(blobUrls);
    document.head.appendChild(importMapEl);

    // ---------- 4) Runtime feature probing + init ----------
    const rt = opts.runtime || {};
    const autoProbe = rt.autoProbe !== false;
    const enable = rt.enable || {};
    const urls = rt.urls || {};
    const allowInject = !!rt.allowScriptInjection;

    const allSource = Object.values(manifest.files).join("\n");
    const want = {
        ammo: enable.ammo ?? ((autoProbe && /\bAmmoJSPlugin\b/.test(allSource)) || false),
        recast: enable.recast ?? ((autoProbe && /\bRecastJSPlugin\b/.test(allSource)) || false),
        havok: enable.havok ?? ((autoProbe && /\bHavokPlugin\b/.test(allSource)) || false),
        sound: enable.sound ?? ((autoProbe && /\bBABYLON\.Sound\b/.test(allSource)) || false),
        toolkit:
            enable.toolkit ??
            ((autoProbe &&
                (/\bBABYLON\.Toolkit\.SceneManager\.InitializePlayground\b/.test(allSource) ||
                    /\bSM\.InitializePlayground\b/.test(allSource) ||
                    location.href.includes("BabylonToolkit") ||
                    ((): boolean => {
                        try {
                            return localStorage.getItem("babylon-toolkit") === "true" || localStorage.getItem("babylon-toolkit-used") === "true";
                        } catch {
                            return false;
                        }
                    })())) ||
                false),
    };

    const defaults = {
        ammo: "https://cdn.babylonjs.com/ammo/ammo.js",
        recast: "https://cdn.babylonjs.com/recast.js",
        havok: "https://cdn.babylonjs.com/havok/HavokPhysics.js",
        toolkit: "https://cdn.jsdelivr.net/gh/BabylonJS/BabylonToolkit@master/Runtime/babylon.toolkit.js",
    };

    async function initRuntime(engine: ThinEngine) {
        // AMMO
        if (want.ammo) {
            const hasFactory = typeof (window as any).Ammo === "function";
            if (!hasFactory && allowInject) {
                await loadScriptOnce(urls.ammo || defaults.ammo);
            }
            if (typeof (window as any).Ammo === "function") {
                try {
                    await (window as any).Ammo();
                } catch {}
            }
        }

        // RECAST
        if (want.recast) {
            const hasFactory = typeof (window as any).Recast === "function";
            if (!hasFactory && allowInject) {
                await loadScriptOnce(urls.recast || defaults.recast);
            }
            if (typeof (window as any).Recast === "function") {
                try {
                    await (window as any).Recast();
                } catch {}
            }
        }

        // HAVOK
        if (want.havok) {
            const hasFactory = typeof (window as any).HavokPhysics === "function";
            if (!hasFactory && allowInject) {
                await loadScriptOnce(urls.havok || defaults.havok);
            }
            if (typeof (window as any).HavokPhysics === "function" && typeof (window as any).HK === "undefined") {
                try {
                    (window as any).HK = await (window as any).HavokPhysics();
                } catch {}
            }
        }

        // SOUND
        if (want.sound) {
            try {
                const anyB = BABYLON as any;
                const opts = (engine as any).getCreationOptions?.();
                if (!opts || opts.audioEngine !== false) {
                    anyB.AbstractEngine.audioEngine = anyB.AbstractEngine.AudioEngineFactory(
                        engine.getRenderingCanvas(),
                        engine.getAudioContext?.(),
                        engine.getAudioDestination?.()
                    );
                }
            } catch {
                /* ignore */
            }
        }

        // TOOLKIT
        if (want.toolkit) {
            await loadScriptOnce(urls.toolkit || defaults.toolkit);
            try {
                localStorage.setItem("babylon-toolkit-used", "true");
            } catch {}
        }
    }

    // ---------- 5) Runner ----------
    async function run(engine: ThinEngine, canvas: HTMLCanvasElement): Promise<Scene> {
        await initRuntime(engine);

        await ensureImportShim();
        const importFn: (s: string) => Promise<any> = (window as any).importShim ?? (async (s: string) => await import(s));

        const entrySpec = specKey(entryPath);
        const mod = await importFn(entrySpec);

        let createScene: any = null;
        if (typeof mod.createScene === "function") {
            createScene = mod.createScene;
        } else if (typeof mod.default === "function") {
            createScene = mod.default;
        } else if (mod.Playground?.CreateScene) {
            createScene = (e: any, c: any) => mod.Playground.CreateScene(e, c);
        }
        if (!createScene) {
            throw new Error("No createScene export (createScene / default / Playground.CreateScene) found in entry module.");
        }
        return await (createScene(engine, canvas) ?? createScene());
    }

    function dispose() {
        const el = document.getElementById(importMapId) as HTMLScriptElement | null;
        if (el?.dataset.urls) {
            try {
                for (const u of JSON.parse(el.dataset.urls)) {
                    URL.revokeObjectURL(u);
                }
            } catch {}
        }
        el?.remove();
    }

    return { run, dispose };
}
