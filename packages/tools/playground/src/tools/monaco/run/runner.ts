/* eslint-disable no-await-in-loop */
/* eslint-disable jsdoc/require-jsdoc */

import { Logger } from "@dev/core";
import type { ThinEngine, Scene } from "@dev/core";
import type * as monacoNs from "monaco-editor/esm/vs/editor/editor.api";
import * as lexer from "es-module-lexer";
import type { TsPipeline } from "../ts/tsPipeline";
import type { DirHandle } from "./localPackage";
import { BuildLocalPackageImportMap } from "./localPackage";
import { GetWorkerForModel } from "../worker/worker";

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
    run(createEngine: () => Promise<ThinEngine | null>, canvas: HTMLCanvasElement): Promise<[Scene, ThinEngine]>;
    dispose(): void;
};

/**
 * Sanitize and normalize code for processing
 * @param code
 * @returns
 */
function SanitizeCode(code: string): string {
    let result = code.normalize("NFKC");

    const hiddenCharsRegex = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
    // eslint-disable-next-line no-control-regex
    const controlCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

    // Visualizer markers for hidden characters
    /* eslint-disable @typescript-eslint/naming-convention */
    const markers: Record<string, string> = {
        "\u200B": "⟦ZWSP⟧",
        "\u200C": "⟦ZWNJ⟧",
        "\u200D": "⟦ZWJ⟧",
        "\u200E": "⟦LRM⟧",
        "\u200F": "⟦RLM⟧",
        "\u202A": "⟦LRE⟧",
        "\u202B": "⟦RLE⟧",
        "\u202C": "⟦PDF⟧",
        "\u202D": "⟦LRO⟧",
        "\u202E": "⟦RLO⟧",
        "\u2060": "⟦WJ⟧",
        "\u2066": "⟦LRI⟧",
        "\u2067": "⟦RLI⟧",
        "\u2068": "⟦FSI⟧",
        "\u2069": "⟦PDI⟧",
        "\uFEFF": "⟦BOM⟧",
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    result = result.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, (ch) => markers[ch] || `⟦U+${ch.charCodeAt(0).toString(16).toUpperCase()}⟧`);

    result = result.replace(hiddenCharsRegex, "").replace(controlCharsRegex, "");

    return result;
}

/**
 *
 * @param manifest
 * @param opts
 * @param pipeline
 * @returns
 */
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

        // Map every ts/tsx model to diagnostics
        for (const model of monaco.editor.getModels().filter((m) => /[.]tsx?$/.test(m.uri.path))) {
            const svc = await GetWorkerForModel(model);
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

    // Phase 1: per-file transpile (TS->JS) and shader wrapping
    for (const [path, rawSrc] of Object.entries(manifest.files)) {
        const src = SanitizeCode(rawSrc);
        // Shader wrap as raw string
        if (/[.](wgsl|glsl|fx)$/i.test(path)) {
            compiled[path] = `export default ${JSON.stringify(src)};`;
            continue;
        }
        let code = src;
        if (/[.]tsx?$/i.test(path) && ts) {
            code = (await pipeline.emitOneAsync(path)).js;
        } else {
            code += `\n//# sourceURL=file:///pg/${path}`;
        }
        compiled[path] = code;
    }

    // ------ Phase 1.5: map local packages (hot-read from disk) ------
    const localHandles: Record<string, DirHandle> = (window as any).__PG_LOCAL_PKG_HANDLES__ || {};
    const localImports: Record<string, string> = {};
    for (const fullSpec of Object.keys(localHandles)) {
        // safety: only accept “…@local”
        if (!/@local$/.test(fullSpec)) {
            continue;
        }
        try {
            Object.assign(localImports, await BuildLocalPackageImportMap(fullSpec, localHandles[fullSpec]));
        } catch (e) {
            Logger.Warn("Failed to build local package import map for " + fullSpec);
        }
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
            const normalized = normalizeForCdn(spec);

            if (localImports[spec] || localImports[normalized]) {
                replacement = localImports[spec] ?? localImports[normalized]!;
            } else if (isRel) {
                const target = pickActual(resolveRelative(path, spec).replace(/\\/g, "/"));
                if (target) {
                    replacement = specKey(target);
                }
            } else {
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
    // seed local blobs first
    for (const [k, v] of Object.entries(localImports)) {
        imports[k] = v;
    }
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
                const anyB = (window as any).BABYLON as any;
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
    async function run(createEngine: () => Promise<ThinEngine | null>, canvas: HTMLCanvasElement): Promise<[Scene, ThinEngine]> {
        await ensureImportShim();
        const importFn: (s: string) => Promise<any> = (window as any).importShim ?? (async (s: string) => await import(s));

        const entrySpec = specKey(entryPath);
        const mod = await importFn(entrySpec);
        let engine: ThinEngine | null = null;
        if (typeof mod.createEngine === "function") {
            try {
                engine = await mod.createEngine();
                if (!engine) {
                    throw new Error("createEngine() returned null.");
                }
            } catch (e) {
                Logger.Warn("Failed to call user createEngine(): " + (e as Error).message);
                Logger.Warn("Falling back to default engine creation.");
            }
        }
        if (!engine) {
            engine = await createEngine();
        }
        if (!engine) {
            throw new Error("Failed to create engine.");
        }
        (window as any).engine = engine;
        await initRuntime(engine);

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
        return [await (createScene(engine, canvas) ?? createScene()), engine];
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
