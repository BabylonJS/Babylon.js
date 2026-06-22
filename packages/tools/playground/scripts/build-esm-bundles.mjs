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
import { mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../public/esm");

/**
 * Each entry bundles one public ESM package into a single self-registering file.
 * `global` mirrors the UMD global the package populates today (see umdGlobals in
 * packages/public/rollupUMDHelper.mjs).
 *
 * `core` MUST load first; the others augment the same BABYLON namespace.
 *
 * KNOWN LIMITATION (Phase 4): the non-core bundles below currently INLINE a private
 * copy of `@babylonjs/core` (esbuild has no `external`+global mapping like UMD's
 * `globals`). Measured totals: core 7.0 MB; each secondary lib 0.8–3.0 MB *including
 * duplicated core*. To match UMD's layout (only `babylon.js` carries core), the
 * secondary configs must mark `@babylonjs/core` (and subpaths) external and resolve
 * them to the already-loaded global. Until then the Playground loads CORE ONLY.
 */
const bundles = [
    { file: "babylon.esm.js", pkg: "@babylonjs/core", global: "BABYLON", merge: true },
    { file: "babylon.gui.esm.js", pkg: "@babylonjs/gui", global: "BABYLON.GUI", merge: false },
    // The following packages register side effects onto the core BABYLON namespace
    // (loaders, materials, etc.). Their named exports are merged into BABYLON too.
    // NOTE: these currently duplicate core until externalization is added (Phase 4).
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
    await mkdir(outDir, { recursive: true });
    for (const cfg of bundles) {
        const outfile = resolve(outDir, cfg.file);
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
            });
            console.log(`  built ${cfg.file}  (${cfg.pkg})`);
        } catch (e) {
            console.warn(`  SKIPPED ${cfg.file} (${cfg.pkg}): ${e.message?.split("\n")[0]}`);
        }
    }
    console.log(`ESM bundles written to ${outDir}`);
}

await main();
