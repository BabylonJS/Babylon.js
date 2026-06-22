/* eslint-disable no-console */
/**
 * Phase 1 prototype — Playground UMD deprecation.
 *
 * Produces single-file, minified ESM bundles of the Babylon runtime libraries
 * that the Playground depends on, as a self-hosted alternative to the UMD
 * `<script>` bundles currently injected by `public/index.js`.
 *
 * Each generated bundle is "self-registering": after evaluation it assigns the
 * same `globalThis.BABYLON*` namespaces the UMD bundles populate today. This is
 * what preserves backwards compatibility — legacy snippets that use the bare
 * `BABYLON.*` global keep working, but no UMD is loaded.
 *
 * Why a single-file bundle (not the raw `@babylonjs/core` module tree)?
 *   - The unbundled tree is ~3258 ESM files; `import * as BABYLON` would issue
 *     thousands of HTTP requests (waterfall).
 *   - A single minified ESM bundle of core measures ~7.0 MB raw / ~1.57 MB gz,
 *     which is slightly SMALLER than the UMD `babylon.js` it replaces
 *     (7.84 MB / 1.62 MB). So snapshot size and per-load traffic do not grow.
 *
 * Prerequisite: the `@babylonjs/*` ES6 packages must be built first:
 *   npm run build:es6:libs
 *
 * Output (gitignored): packages/tools/playground/public/esm/*.js
 */

import { build } from "esbuild";
import { init, parse } from "es-module-lexer";
import { existsSync, readFileSync } from "fs";
import { mkdir } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../public/esm");

/**
 * Resolves an ESM re-export specifier (as found inside a built `@babylonjs/core`
 * file) to an absolute file path. Handles relative specifiers (the common case
 * for `export * from "./..."` chains) and, as a fallback, bare specifiers.
 * @param {string} parentFile absolute path of the file containing the specifier
 * @param {string} spec the import/export specifier
 * @returns {string | null}
 */
function resolveChild(parentFile, spec) {
    if (spec.startsWith(".")) {
        const base = resolve(dirname(parentFile), spec);
        if (existsSync(base) && !existsSync(join(base, "index.js"))) {
            return base;
        }
        if (existsSync(base + ".js")) {
            return base + ".js";
        }
        if (existsSync(join(base, "index.js"))) {
            return join(base, "index.js");
        }
        return existsSync(base) ? base : null;
    }
    try {
        return fileURLToPath(import.meta.resolve(spec));
    } catch {
        return null;
    }
}

/**
 * Statically collects the full set of named exports a `@babylonjs/core` module
 * exposes, following `export * from "..."` chains. No code is executed (pure
 * lexing), so browser-only side effects in core never run during the build.
 * @param {string} filePath absolute path of the module to analyze
 * @param {Set<string>} [names] accumulator of export names
 * @param {Set<string>} [seen] visited files (cycle guard)
 * @returns {Set<string>}
 */
function collectCoreExports(filePath, names = new Set(), seen = new Set()) {
    if (!filePath || seen.has(filePath) || !existsSync(filePath)) {
        return names;
    }
    seen.add(filePath);
    const src = readFileSync(filePath, "utf8");
    const [imports, exports] = parse(src);
    for (const e of exports) {
        if (e.n && e.n !== "default") {
            names.add(e.n);
        }
    }
    for (const i of imports) {
        if (!i.n) {
            continue;
        }
        const stmt = src.slice(i.ss, i.se);
        // Only `export * from "..."` needs expansion; named re-exports are already in `exports`.
        if (/^\s*export\s*\*(?!\s*as)/.test(stmt)) {
            collectCoreExports(resolveChild(filePath, i.n), names, seen);
        }
    }
    return names;
}

/**
 * esbuild plugin that rewrites every `@babylonjs/core` (and subpath) import to
 * read from the already-loaded `globalThis.BABYLON` global, instead of bundling
 * a private copy of core. This mirrors UMD's `globals` external mapping (see
 * `umdGlobals` in packages/public/rollupUMDHelper.mjs) and is what lets the
 * secondary library bundles stay small (core is loaded once, by `babylon.esm.js`).
 * @type {import("esbuild").Plugin}
 */
const externalizeCorePlugin = {
    name: "externalize-core-to-global",
    setup(pluginBuild) {
        const ns = "core-global";
        pluginBuild.onResolve({ filter: /^@babylonjs\/core(\/.*)?$/ }, async (args) => {
            // The guarded re-resolve below re-enters this hook; let esbuild resolve it normally then.
            if (args.pluginData?.externalized || args.kind === "entry-point") {
                return undefined;
            }
            const resolved = await pluginBuild.resolve(args.path, {
                resolveDir: args.resolveDir,
                kind: args.kind,
                importer: args.importer,
                pluginData: { externalized: true },
            });
            if (resolved.errors.length) {
                return undefined; // let esbuild report the original resolution error
            }
            // `tslib.es6.js` re-exports the TypeScript runtime helpers (__extends, __decorate, ...).
            // These are build helpers, NOT part of the runtime BABYLON global, so they must be
            // bundled (esbuild inlines the tiny implementations) rather than read from the global.
            if (/tslib\.es6\.js$/.test(resolved.path)) {
                return { path: resolved.path };
            }
            return { path: resolved.path, namespace: ns };
        });
        pluginBuild.onLoad({ filter: /.*/, namespace: ns }, (args) => {
            const names = [...collectCoreExports(args.path)];
            const decl = names.length ? `export const { ${names.join(", ")} } = globalThis.BABYLON;\n` : "";
            // `export default` covers the rare default-import of core; named imports are lenient
            // (undefined if absent), matching UMD's global-access behavior — never a build error.
            return { contents: decl + "export default globalThis.BABYLON;", loader: "js" };
        });
    },
};

/**
 * Each entry bundles one public ESM package into a single self-registering file.
 * `global` mirrors the UMD global the package populates today (see umdGlobals in
 * packages/public/rollupUMDHelper.mjs).
 *
 * `core` MUST load first; the others augment the same BABYLON namespace.
 *
 * Core externalization (Phase 4): every non-core bundle marks `@babylonjs/core`
 * (and subpaths) external and resolves them to the already-loaded `globalThis.BABYLON`
 * global (see `externalizeCorePlugin`). So only `babylon.esm.js` carries core; the
 * secondary bundles stay small, matching the UMD layout where only `babylon.js`
 * ships core and the other UMD files reference the `BABYLON` global.
 */
const bundles = [
    { file: "babylon.esm.js", pkg: "@babylonjs/core", global: "BABYLON", merge: true },
    { file: "babylon.gui.esm.js", pkg: "@babylonjs/gui", global: "BABYLON.GUI", merge: false },
    // The following packages register side effects onto the core BABYLON namespace
    // (loaders, materials, etc.). Their named exports are merged into BABYLON too.
    { file: "babylonjs.loaders.esm.js", pkg: "@babylonjs/loaders", global: "BABYLON", merge: true },
    { file: "babylonjs.materials.esm.js", pkg: "@babylonjs/materials", global: "BABYLON", merge: true },
    { file: "babylonjs.serializers.esm.js", pkg: "@babylonjs/serializers", global: "BABYLON", merge: true },
    { file: "babylonjs.postProcess.esm.js", pkg: "@babylonjs/post-processes", global: "BABYLON", merge: true },
    { file: "babylonjs.proceduralTextures.esm.js", pkg: "@babylonjs/procedural-textures", global: "BABYLON", merge: true },
    { file: "babylonjs.addons.esm.js", pkg: "@babylonjs/addons", global: "ADDONS", merge: false },
];

/**
 * Builds the small JS entry that imports a package namespace and assigns it to
 * the matching global, mirroring UMD self-registration.
 * @param {{pkg: string, global: string, merge: boolean}} cfg
 * @returns {string}
 */
function makeEntry(cfg) {
    const path = cfg.global.split(".");
    const ns = "globalThis." + path.join(".");
    // Ensure parent objects exist (e.g. globalThis.BABYLON before .GUI).
    const ensure = [];
    let acc = "globalThis";
    for (let i = 0; i < path.length - 1; i++) {
        acc += "." + path[i];
        ensure.push(`${acc} = ${acc} || {};`);
    }
    const assign = cfg.merge ? `${ns} = Object.assign(${ns} || {}, __ns);` : `${ns} = __ns;`;
    return [`import * as __ns from ${JSON.stringify(cfg.pkg)};`, ...ensure, assign].join("\n");
}

async function main() {
    await init;

    // Fail-soft: the bundles are produced from the compiled `@babylonjs/*` ES6 libs
    // (`npm run build:es6:libs`). When those libs are absent — e.g. a CI job that only
    // builds UMD — skip cleanly with a single clear message instead of emitting a wall
    // of per-bundle resolution errors. `prepare-snapshot` then proceeds without ESM
    // bundles rather than failing the build; the publish pipeline (which builds es6
    // first) still ships them.
    let coreBuilt = false;
    try {
        coreBuilt = existsSync(fileURLToPath(import.meta.resolve("@babylonjs/core")));
    } catch {
        coreBuilt = false;
    }
    if (!coreBuilt) {
        console.warn("ESM bundles skipped: built @babylonjs/core not found. Run `npm run build:es6:libs` first.");
        return;
    }

    await mkdir(outDir, { recursive: true });
    for (const cfg of bundles) {
        const outfile = resolve(outDir, cfg.file);
        const isCore = cfg.pkg === "@babylonjs/core";
        try {
            await build({
                stdin: { contents: makeEntry(cfg), resolveDir: process.cwd(), loader: "js" },
                outfile,
                bundle: true,
                format: "esm",
                platform: "browser",
                minify: true,
                legalComments: "none",
                logLevel: "error",
                // Core ships itself; every other bundle reads core from globalThis.BABYLON.
                plugins: isCore ? [] : [externalizeCorePlugin],
            });
            console.log(`  built ${cfg.file}  (${cfg.pkg})`);
        } catch (e) {
            console.warn(`  SKIPPED ${cfg.file} (${cfg.pkg}): ${e.message?.split("\n")[0]}`);
        }
    }
    console.log(`ESM bundles written to ${outDir}`);
}

await main();
