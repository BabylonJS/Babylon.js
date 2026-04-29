/**
 * Rollup configuration helper for Babylon.js UMD packages.
 *
 * Mirrors the behavior of commonUMDWebpackConfiguration from @dev/build-tools,
 * producing the same file names, UMD globals, and minification/copy behaviour.
 *
 * Usage in a rollup.config.umd.mjs:
 *   import { commonUMDRollupConfiguration } from "../rollupUMDHelper.mjs";
 *   export default commonUMDRollupConfiguration({ devPackageName: "core", ... });
 */

import aliasPlugin from "@rollup/plugin-alias";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";
import url from "@rollup/plugin-url";
import { copyFileSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

// Repo root — used as the filterRoot for @rollup/plugin-typescript so that
// `**/*.ts` patterns are matched against repo-relative paths (which never start
// with "..") regardless of where in the monorepo the file being compiled lives.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// ---------------------------------------------------------------------------
// Package name mappings
// ---------------------------------------------------------------------------

/**
 * Private packages are always bundled, never externalized as UMD externals.
 * Mirrors the `privatePackages` list in `@dev/build-tools/src/packageMapping.ts`.
 */
const privatePackages = ["shared-ui-components"];

/** Maps dev package names (from source imports) to their UMD module IDs. */
const devNameToUMDId = {
    core: "babylonjs",
    gui: "babylonjs-gui",
    loaders: "babylonjs-loaders",
    serializers: "babylonjs-serializers",
    materials: "babylonjs-materials",
    "post-processes": "babylonjs-post-process",
    "procedural-textures": "babylonjs-procedural-textures",
    "inspector-legacy": "babylonjs-inspector-legacy",
    inspector: "babylonjs-inspector",
    "node-editor": "babylonjs-node-editor",
    "node-geometry-editor": "babylonjs-node-geometry-editor",
    "node-render-graph-editor": "babylonjs-node-render-graph-editor",
    "node-particle-editor": "babylonjs-node-particle-editor",
    "gui-editor": "babylonjs-gui-editor",
    accessibility: "babylonjs-accessibility",
    ktx2decoder: "babylonjs-ktx2decoder",
    "shared-ui-components": "babylonjs-shared-ui-components",
    addons: "babylonjs-addons",
    "smart-filters": "babylonjs-smart-filters",
};

/**
 * Maps UMD module IDs to the global variable name used in browser builds.
 * Exported so individual rollup configs can extend or override it.
 */
export const umdGlobals = {
    babylonjs: "BABYLON",
    "babylonjs-gui": "BABYLON.GUI",
    "babylonjs-loaders": "BABYLON",
    "babylonjs-serializers": "BABYLON",
    "babylonjs-materials": "BABYLON",
    "babylonjs-post-process": "BABYLON",
    "babylonjs-procedural-textures": "BABYLON",
    "babylonjs-inspector-legacy": "INSPECTOR",
    "babylonjs-inspector": "INSPECTOR",
    "babylonjs-node-editor": "BABYLON.NodeEditor",
    "babylonjs-node-geometry-editor": "BABYLON.NodeGeometryEditor",
    "babylonjs-node-render-graph-editor": "BABYLON.NodeRenderGraphEditor",
    "babylonjs-node-particle-editor": "BABYLON.NodeParticleEditor",
    "babylonjs-gui-editor": "BABYLON.GuiEditor",
    "babylonjs-accessibility": "BABYLON.Accessibility",
    "babylonjs-ktx2decoder": "KTX2DECODER",
    "babylonjs-shared-ui-components": "BABYLON.SharedUIComponents",
    "babylonjs-addons": "ADDONS",
    "babylonjs-smart-filters": "BABYLON.SmartFilters",
    "babylonjs-gltf2interface": "BABYLON.GLTF2",
};

/** Base output filename metadata, mirroring umdPackageMapping from packageMapping.ts. */
const umdPackageMeta = {
    babylonjs: { baseFilename: "babylon" },
    "babylonjs-gui": { baseFilename: "babylon.gui" },
    "babylonjs-serializers": { baseFilename: "babylonjs.serializers" },
    "babylonjs-loaders": { baseFilename: "babylonjs.loaders" },
    "babylonjs-materials": { baseFilename: "babylonjs.materials" },
    "babylonjs-procedural-textures": { baseFilename: "babylonjs.proceduralTextures" },
    "babylonjs-inspector-legacy": { baseFilename: "babylon.inspector", isBundle: true },
    "babylonjs-inspector": { baseFilename: "babylon.inspector-v2", isBundle: true },
    "babylonjs-node-editor": { baseFilename: "babylon.nodeEditor" },
    "babylonjs-node-geometry-editor": { baseFilename: "babylon.nodeGeometryEditor" },
    "babylonjs-node-render-graph-editor": { baseFilename: "babylon.nodeRenderGraphEditor" },
    "babylonjs-node-particle-editor": { baseFilename: "babylon.nodeParticleEditor" },
    "babylonjs-gui-editor": { baseFilename: "babylon.guiEditor" },
    "babylonjs-accessibility": { baseFilename: "babylon.accessibility" },
    "babylonjs-post-process": { baseFilename: "babylonjs.postProcess" },
    "babylonjs-ktx2decoder": { baseFilename: "babylon.ktx2Decoder" },
    "babylonjs-addons": { baseFilename: "babylonjs.addons" },
    "babylonjs-smart-filters": { baseFilename: "babylonjs.smartFilters" },
};

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

/**
 * Sub-path namespace resolution for dev package imports, mirroring the
 * `namespace` mapping in `@dev/build-tools/src/packageMapping.ts`.
 *
 * Some Babylon dev packages expose different browser globals depending on
 * the sub-path imported.  For example `loaders/glTF/2.0/someModule` maps
 * to `BABYLON.GLTF2` rather than `BABYLON`.  Webpack's externals handled
 * this via a function-valued namespace; rollup needs explicit logic here.
 *
 * @param {string} source  Full import specifier (e.g. "loaders/glTF/2.0/glTFLoaderExtensionRegistry").
 * @param {string} pkg     Leading package segment (e.g. "loaders").
 * @returns {string|null}  The browser global path if it differs from the default, or null.
 */
function resolveSubPathNamespace(source, pkg) {
    const normalized = source.replaceAll("\\", "/");

    if (pkg === "core") {
        if (
            normalized.includes("/Debug/axesViewer") ||
            normalized.includes("/Debug/boneAxesViewer") ||
            normalized.includes("/Debug/physicsViewer") ||
            normalized.includes("/Debug/skeletonViewer")
        ) {
            return "BABYLON.Debug";
        }
        return null; // default "BABYLON"
    }

    if (pkg === "loaders") {
        if (normalized.includes("/glTF/1.0")) {
            return "BABYLON.GLTF1";
        } else if (normalized.includes("/glTF/2.0/Extensions")) {
            return "BABYLON.GLTF2.Loader.Extensions";
        } else if (normalized.includes("/glTF/2.0/glTFLoaderInterfaces")) {
            return "BABYLON.GLTF2.Loader";
        } else if (normalized.includes("/glTF/2.0")) {
            return "BABYLON.GLTF2";
        }
        return null; // default "BABYLON"
    }

    return null;
}

/**
 * Rollup plugin that intercepts imports from Babylon.js dev packages and marks
 * them as external, rewriting to their UMD module IDs.
 *
 * Packages listed in excludePackages are NOT externalized – they will be
 * bundled (this is the package being built).
 *
 * When a sub-path import resolves to a different browser global (e.g.
 * `loaders/glTF/2.0/…` → `BABYLON.GLTF2`), the plugin emits a synthetic
 * external ID (e.g. `babylonjs-loaders::BABYLON.GLTF2`) and registers the
 * corresponding global so the UMD output receives the correct namespace.
 *
 * @param {string[]} excludePackages Dev package names to bundle rather than externalize.
 */
export function babylonUMDExternalsPlugin(excludePackages = []) {
    /** Extra globals discovered via sub-path namespace resolution. */
    const extraGlobals = {};

    return {
        name: "babylon-umd-externals",
        resolveId(source) {
            // gltf2interface is always external
            if (source.includes("babylonjs-gltf2interface")) {
                return { id: "babylonjs-gltf2interface", external: true };
            }
            // Extract the leading package name segment (e.g. "core" from "core/Legacy/legacy")
            const pkg = source.split("/")[0];
            if (excludePackages.includes(pkg)) {
                return null; // let alias / node resolution handle it
            }
            // Private packages are always bundled, never externalized.
            if (privatePackages.includes(pkg)) {
                return null;
            }
            const umdId = devNameToUMDId[pkg];
            if (umdId) {
                // Check if this sub-path needs a different browser global.
                const subNs = resolveSubPathNamespace(source, pkg);
                if (subNs) {
                    // Use a synthetic external ID that encodes the target global.
                    // The `::` separator is not valid in package names, so it won't
                    // collide with real UMD IDs.
                    const syntheticId = `${umdId}::${subNs}`;
                    extraGlobals[syntheticId] = subNs;
                    return { id: syntheticId, external: true };
                }
                return { id: umdId, external: true };
            }
            return null;
        },

        /** Expose discovered extra globals so the output config can include them. */
        get globals() {
            return extraGlobals;
        },
    };
}

/**
 * Rollup renderChunk plugin that replaces any dynamic `import("umdId")` calls
 * that survive inlineDynamicImports (i.e. imports of external packages) with
 * `Promise.resolve(GLOBAL)` so the output remains ES5/ES6-compatible.
 *
 * This is needed because Rollup cannot inline dynamic imports of external
 * modules — it leaves `import("babylonjs")` etc. in the UMD output, which is
 * ES2020 syntax that fails the `es-check es6` gate.
 */
function rewriteDynamicExternalImportsPlugin() {
    return {
        name: "rewrite-dynamic-external-imports",
        renderChunk(code) {
            let result = code;
            // Replace process.env.NODE_ENV so React (and other libs) bundle in production
            // mode and don't reference the Node.js `process` global in browsers.
            result = result.replaceAll("process.env.NODE_ENV", '"production"');
            for (const [umdId, globalVar] of Object.entries(umdGlobals)) {
                // Match import("umdId") or import('umdId') — dynamic import of an external.
                const re = new RegExp(`import\\((['"])${umdId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1\\)`, "g");
                result = result.replace(re, `Promise.resolve(${globalVar})`);
            }
            return result !== code ? { code: result, map: null } : null;
        },
    };
}

/**
 * Fallback plugin that transpiles TypeScript files that @rollup/plugin-typescript
 * cannot compile because they are outside the tsconfig rootDir (e.g. aliased
 * sources from other packages in the monorepo).
 *
 * Uses ts.transpileModule for single-file transpilation without type checking.
 */
function transpileExternalTsPlugin() {
    // Import typescript lazily so the plugin doesn't error in pure-JS contexts.
    let ts;
    return {
        name: "transpile-external-ts",
        async transform(code, id) {
            // Only handle .ts/.tsx files.
            if (!id.endsWith(".ts") && !id.endsWith(".tsx")) return null;
            // Skip files inside this package's own src (handled by @rollup/plugin-typescript).
            if (id.startsWith(resolve("src"))) return null;
            if (!ts) {
                ts = (await import("typescript")).default;
            }
            const isTsx = id.endsWith(".tsx");
            const result = ts.transpileModule(code, {
                fileName: id,
                compilerOptions: {
                    module: ts.ModuleKind.ESNext,
                    target: ts.ScriptTarget.ES2020,
                    jsx: isTsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.Preserve,
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    experimentalDecorators: true,
                },
            });
            return { code: result.outputText, map: result.sourceMapText || null };
        },
    };
}

/**
 * Rollup plugin that copies a built output file to a secondary filename after
 * the bundle is written.  Mirrors webpack's CopyMinToMaxWebpackPlugin.
 *
 * @param {string} outputDir  Absolute path to the output directory.
 * @param {(chunkName: string) => string} primaryName  Returns the primary output filename.
 * @param {string[]} chunkNames  Names of all entry chunks to copy.
 */
function copyMinToMaxPlugin(outputDir, primaryName, chunkNames) {
    return {
        name: "copy-min-to-max",
        closeBundle() {
            for (const chunkName of chunkNames) {
                const primary = primaryName(chunkName);
                let secondary;
                if (primary.includes(".min.js")) {
                    // maxMode=false: babylon.gui.min.js  →  babylon.gui.js
                    secondary = primary.replace(/\.min\.js$/, ".js");
                } else {
                    // maxMode=true: babylon.js  →  babylon.max.js
                    secondary = primary.replace(/\.js$/, ".max.js");
                }
                const src = join(outputDir, primary);
                const dst = join(outputDir, secondary);
                if (existsSync(src)) {
                    copyFileSync(src, dst);
                    const srcMap = src + ".map";
                    if (existsSync(srcMap)) {
                        copyFileSync(srcMap, dst + ".map");
                    }
                }
            }
        },
    };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function camelize(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Creates a Rollup configuration for a Babylon.js UMD package.
 * Accepts the same option shape as commonUMDWebpackConfiguration from
 * @dev/build-tools so existing configs can be ported with minimal changes.
 *
 * @param {object} options
 * @param {string} options.devPackageName      Dev package name (e.g. "core", "gui").
 * @param {string} [options.devPackageAliasPath]
 *   Path to the dev package source/dist to alias; defaults to
 *   ../../../dev/{camelCase(name)}/src relative to process.cwd().
 * @param {"development"|"production"} [options.mode]  Defaults to "development".
 * @param {string} [options.namespace]
 *   UMD global name for this bundle (e.g. "BABYLON.GUI").
 *   Defaults to the value in umdGlobals.
 * @param {string} [options.outputPath]        Output directory; defaults to process.cwd().
 * @param {Record<string,string>} [options.alias]  Additional alias entries.
 * @param {string[]} [options.optionalExternalFunctionSkip]
 *   Extra dev package names to bundle (not externalize).
 * @param {boolean} [options.maxMode]
 *   Dev builds produce .max.js; prod builds produce .js (no suffix).
 * @param {boolean} [options.minToMax]
 *   After a production build, copy the output to a second filename
 *   (mirrors CopyMinToMaxWebpackPlugin behaviour).
 * @param {Record<string,string>} [options.entryPoints]
 *   Named entry points for multi-file packages.
 * @param {string|((chunk:{name:string})=>string)} [options.overrideFilename]
 *   Override the output filename (string) or per-chunk (function).
 */
export function commonUMDRollupConfiguration(options) {
    const {
        devPackageName,
        devPackageAliasPath,
        mode = "development",
        namespace,
        outputPath = process.cwd(),
        alias: aliasMap = {},
        optionalExternalFunctionSkip = [],
        maxMode = false,
        minToMax = false,
        entryPoints,
        overrideFilename,
    } = options;

    const production = mode === "production";
    const umdId = devNameToUMDId[devPackageName] || devPackageName;
    const meta = umdPackageMeta[umdId] ?? { baseFilename: devPackageName };
    const { baseFilename, isBundle = false } = meta;

    // Global variable name this bundle exports to (e.g. "BABYLON.GUI")
    const outputName = namespace ?? umdGlobals[umdId] ?? devPackageName.toUpperCase();

    // Path to source for the package being built
    const defaultAliasSrc = devPackageAliasPath ?? `../../../dev/${camelize(devPackageName)}/src`;

    const aliasEntries = [
        { find: devPackageName, replacement: resolve(defaultAliasSrc) },
        ...Object.entries(aliasMap).map(([find, replacement]) => ({
            find,
            replacement: resolve(replacement),
        })),
    ];

    /**
     * Returns the primary output filename for a given entry chunk name.
     * Mirrors the filename computation in commonUMDWebpackConfiguration.
     */
    const primaryFilename = (chunkName) => {
        if (typeof overrideFilename === "function") {
            return overrideFilename({ chunk: { name: chunkName } });
        }
        if (typeof overrideFilename === "string") {
            return overrideFilename;
        }
        const base = `${baseFilename}${isBundle ? ".bundle" : ""}`;
        if (maxMode) {
            // Dev: babylon.max.js  |  Prod: babylon.js
            return production ? `${base}.js` : `${base}.max.js`;
        }
        // Dev: babylon.gui.js  |  Prod: babylon.gui.min.js
        return production ? `${base}.min.js` : `${base}.js`;
    };

    const chunkNames = entryPoints ? Object.keys(entryPoints) : [devPackageName];

    const externalsPlugin = babylonUMDExternalsPlugin([devPackageName, ...optionalExternalFunctionSkip]);

    /**
     * Globals resolver used as Rollup's `output.globals` option.
     * Checks extra sub-path globals first, then falls back to the static map.
     */
    const resolveGlobal = (id) => externalsPlugin.globals[id] ?? umdGlobals[id] ?? id;

    const plugins = [
        externalsPlugin,
        aliasPlugin({ entries: aliasEntries }),
        // Inline SVG/PNG/image assets imported from dist/ files as data URIs.
        url({ include: ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif"], limit: Infinity }),
        // Handle SCSS/CSS imports from compiled dist/ files (tool packages).
        // Extracts styles to a companion .css file alongside the UMD bundle.
        postcss({ extract: true, minimize: production, use: ["sass"] }),
        typescript({
            tsconfig: "tsconfig.build.json",
            declaration: false,
            declarationMap: false,
            sourceMap: true,
            inlineSources: false,
            // filterRoot set to the repo root so **/*.ts patterns match files from
            // any package (including aliased cross-package tool sources).
            filterRoot: REPO_ROOT,
            include: ["**/*.ts", "**/*.tsx"],
        }),
        // Fallback: transpile .ts files that are outside the tsconfig rootDir
        // (e.g. aliased tool sources) which @rollup/plugin-typescript skips.
        transpileExternalTsPlugin(),
        nodeResolve({ mainFields: ["browser", "module", "main"], browser: true, extensions: [".ts", ".tsx", ".js", ".jsx"] }),
        commonjs(),
        rewriteDynamicExternalImportsPlugin(),
        ...(production
            ? [
                  terser({
                      compress: { passes: 2, dead_code: true },
                      format: { comments: false },
                  }),
              ]
            : []),
        ...(minToMax && production ? [copyMinToMaxPlugin(resolve(outputPath), primaryFilename, chunkNames)] : []),
    ];

    /**
     * Builds a single Rollup config object for one entry point.
     * UMD format does not support code-splitting (multiple inputs), so we emit
     * one config per entry and return an array when entryPoints is provided.
     */
    const makeSingleConfig = (inputFile, chunkName) => ({
        input: inputFile,
        output: {
            file: resolve(outputPath, primaryFilename(chunkName)),
            format: "umd",
            name: outputName,
            globals: resolveGlobal,
            exports: "named",
            sourcemap: true,
            // extend:true makes Rollup emit `global.BABYLON = global.BABYLON || {}`
            // instead of `global.BABYLON = {}`, so each bundle merges into the shared
            // namespace rather than overwriting the previous bundle's exports.
            extend: true,
            // Inline any dynamic imports so UMD format (which forbids code-splitting) is happy.
            inlineDynamicImports: true,
            freeze: false,
        },
        plugins,
        // Suppress noisy circular-dependency warnings from the large Babylon packages.
        onwarn(warning, warn) {
            if (warning.code === "CIRCULAR_DEPENDENCY") return;
            warn(warning);
        },
    });

    if (entryPoints) {
        // Return an array of single-input configs (one per entry).
        // The copyMinToMaxPlugin is only attached to the first config to avoid
        // copying the same files multiple times.
        return Object.entries(entryPoints).map(([chunkName, inputFile], i) => {
            const perEntryExternals = babylonUMDExternalsPlugin([devPackageName, ...optionalExternalFunctionSkip]);
            const perEntryResolveGlobal = (id) => perEntryExternals.globals[id] ?? umdGlobals[id] ?? id;
            const perEntryPlugins = [
                perEntryExternals,
                aliasPlugin({ entries: aliasEntries }),
                url({ include: ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif"], limit: Infinity }),
                postcss({ extract: true, minimize: production, use: ["sass"] }),
                typescript({
                    tsconfig: "tsconfig.build.json",
                    declaration: false,
                    declarationMap: false,
                    sourceMap: true,
                    inlineSources: false,
                    filterRoot: REPO_ROOT,
                    include: ["**/*.ts", "**/*.tsx"],
                }),
                transpileExternalTsPlugin(),
                nodeResolve({ mainFields: ["browser", "module", "main"], browser: true, extensions: [".ts", ".tsx", ".js", ".jsx"] }),
                commonjs(),
                rewriteDynamicExternalImportsPlugin(),
                ...(production
                    ? [
                          terser({
                              compress: { passes: 2, dead_code: true },
                              format: { comments: false },
                          }),
                      ]
                    : []),
                ...(minToMax && production && i === 0 ? [copyMinToMaxPlugin(resolve(outputPath), primaryFilename, chunkNames)] : []),
            ];
            return {
                input: inputFile,
                output: {
                    file: resolve(outputPath, primaryFilename(chunkName)),
                    format: "umd",
                    name: outputName,
                    globals: perEntryResolveGlobal,
                    exports: "named",
                    sourcemap: true,
                    extend: true,
                    // Inline any dynamic imports so UMD format (which forbids code-splitting) is happy.
                    inlineDynamicImports: true,
                    freeze: false,
                },
                plugins: perEntryPlugins,
                onwarn(warning, warn) {
                    if (warning.code === "CIRCULAR_DEPENDENCY") return;
                    warn(warning);
                },
            };
        });
    }

    return makeSingleConfig("./src/index.ts", devPackageName);
}
