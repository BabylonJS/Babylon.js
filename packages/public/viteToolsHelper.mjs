/**
 * Shared Vite configuration helpers for Babylon.js tool dev servers.
 *
 * Mirrors the role that commonDevWebpackConfiguration played in webpackTools.ts
 * but targets Vite's native-ESM dev server for dramatically faster start times
 * and HMR performance.
 *
 * Usage in a vite.config.ts:
 *   import { commonDevViteConfiguration } from "../../../public/viteToolsHelper.mjs";
 *   export default commonDevViteConfiguration({ port: 1341, aliases: { ... } });
 */

import react from "@vitejs/plugin-react";
import { resolve, join } from "path";

// ---------------------------------------------------------------------------
// CSS module namespace interop
// ---------------------------------------------------------------------------

/**
 * Vite plugin that restores webpack-compatible CSS module namespace import behaviour.
 *
 * webpack transforms `import * as styles from "*.module.scss"` to CJS require(),
 * giving the class-map object directly (e.g. styles["graph-canvas"] works).
 *
 * Vite emits CSS modules as ES modules with `export default { "class": "hashed" }`.
 * A namespace import (`import * as styles`) therefore returns the module namespace
 * rather than the class map, making `styles["graph-canvas"]` return undefined.
 *
 * This plugin rewrites CSS-module namespace imports to default imports before
 * Vite processes them, so the class map is accessed directly and bracket notation
 * continues to work without changing any source code in the tools or sharedUi.
 *
 *   import * as styles from "./foo.module.scss"
 *   → import styles from "./foo.module.scss"
 */
function cssModuleNamespaceInteropPlugin() {
    // Matches: import * as NAME from "...module.scss/css/less/sass"
    const IMPORT_NS_RE = /\bimport\s+\*\s+as\s+(\w+)\s+from\s+(["'][^"']+\.module\.(?:scss|css|less|sass)["'])/g;

    return {
        name: "css-module-namespace-interop",
        enforce: "pre",
        transform(code, id) {
            // Only process TypeScript/JavaScript source files
            if (!/\.[tj]sx?$/.test(id)) return null;
            // Quick bail-out if no CSS module imports present
            if (!code.includes(".module.")) return null;

            const newCode = code.replace(IMPORT_NS_RE, (_match, name, path) => `import ${name} from ${path}`);

            return newCode !== code ? { code: newCode, map: null } : null;
        },
    };
}

// ---------------------------------------------------------------------------
// Externals → globals mapping (same as umdGlobals in rollupUMDHelper.mjs)
// Used for production build.rollupOptions only.
// ---------------------------------------------------------------------------
export const babylonGlobals = {
    babylonjs: "BABYLON",
    "babylonjs-gui": "BABYLON.GUI",
    "babylonjs-loaders": "BABYLON",
    "babylonjs-serializers": "BABYLON",
    "babylonjs-materials": "BABYLON",
    "babylonjs-post-process": "BABYLON",
    "babylonjs-procedural-textures": "BABYLON",
    "babylonjs-inspector": "INSPECTOR",
    "babylonjs-gui-editor": "BABYLON.GuiEditor",
    "babylonjs-accessibility": "BABYLON.Accessibility",
    "babylonjs-addons": "ADDONS",
    "babylonjs-ktx2decoder": "KTX2DECODER",
};

/**
 * Vite plugin that maps bare dev-package imports (e.g. `core/Engines/engine`)
 * to a virtual module backed by a browser global (e.g. `window.BABYLON`).
 *
 * This preserves the "load babylon from CDN, tool bundle references globals"
 * architecture used by the babylon CDN loaders in public/index.js.
 *
 * @param {Record<string, string>} externals
 *   Map from dev-package prefix to global variable path.
 *   E.g. `{ core: "BABYLON", gui: "BABYLON.GUI" }`
 */
export function babylonDevExternalsPlugin(externals) {
    const pkgPrefixes = Object.keys(externals);

    function makeGlobalChain(globalPath) {
        return globalPath.split(".").reduce((acc, key) => `${acc}["${key}"]`, `(typeof globalThis !== "undefined" ? globalThis : window)`);
    }

    return {
        name: "babylon-dev-externals",
        // Run before Vite's built-in TypeScript transform so we see the original
        // import statements and can remove them before esbuild tries to resolve them.
        enforce: "pre",

        // Tell the dep optimizer scanner that these bare specifiers are resolvable.
        // Without this, esbuild's import scan during optimizeDeps would fail to find
        // `core/Engines/...` etc. and report "could not be resolved" errors.
        resolveId(id) {
            if (pkgPrefixes.some((p) => id === p || id.startsWith(p + "/"))) {
                return { id: `\0externalized:${id}`, external: false };
            }
        },

        load(id) {
            if (id.startsWith("\0externalized:")) {
                const realId = id.slice("\0externalized:".length);
                const pkg = pkgPrefixes.find((p) => realId === p || realId.startsWith(p + "/"));
                if (pkg) {
                    const globalChain = makeGlobalChain(externals[pkg]);
                    return `const _g = ${globalChain} ?? {}; export default _g; export const __esModule = true;`;
                }
            }
        },

        // Transform-based approach (dev + build): rewrite import statements that
        // reference external packages into direct property accesses on the global.
        // This is the exact equivalent of webpack's `externals: { "@dev/core": "BABYLON" }`.
        //
        // import { Logger } from "@dev/core"              → const { Logger } = BABYLON ?? {};
        // import { Color3 as C3 } from "core/Maths/..."   → const { Color3: C3 } = BABYLON ?? {};
        // import * as ns from "@dev/core"                 → const ns = BABYLON ?? {};
        // import type { ... } from "@dev/core"            → (removed)
        transform(code, id) {
            if (!/\.[tj]sx?$/.test(id)) return null;
            if (!pkgPrefixes.some((p) => code.includes(`"${p}`) || code.includes(`'${p}`))) return null;

            let result = code;

            for (const [pkg, globalPath] of Object.entries(externals)) {
                const globalChain = makeGlobalChain(globalPath);
                const escapedPkg = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                // `import "pkg[/sub/path]"` — side-effect-only import. The CDN bundle already
                // registers all these modules on the global, so we can safely drop the import.
                const sideEffectRe = new RegExp(`import\\s+["']${escapedPkg}(?:/[^"']*)?["'][ \\t]*;?`, "gm");
                result = result.replace(sideEffectRe, "");

                // --- TypeScript type-level import() expressions ---
                // These appear in type annotation positions (after `:`, `typeof`, `<`, etc.)
                // and must be handled BEFORE the runtime dynamic import rewrite.
                //
                // `typeof import("pkg/…")` → `any`
                const typeofImportRe = new RegExp(`typeof\\s+import\\(\\s*["']${escapedPkg}(?:/[^"']*)?["']\\s*\\)`, "gm");
                result = result.replace(typeofImportRe, `any`);
                //
                // `import("pkg/…").SomeType` in type annotations → `any`
                // Matches `import("pkg/...")` followed by `.Identifier` (member type access).
                const typeMemberImportRe = new RegExp(`import\\(\\s*["']${escapedPkg}(?:/[^"']*)?["']\\s*\\)\\.\\w+`, "gm");
                result = result.replace(typeMemberImportRe, `any`);

                // `import("pkg[/sub/path]")` — runtime dynamic import expression.
                // Rewrite to `Promise.resolve(GLOBAL ?? {})` so the await-destructure
                // pattern `const { X } = await import("pkg/sub")` still works at runtime.
                const dynamicRe = new RegExp(`import\\(\\s*["']${escapedPkg}(?:/[^"']*)?["']\\s*\\)`, "gm");
                result = result.replace(dynamicRe, `Promise.resolve(${globalChain} ?? {})`);

                // Matches `import [type] <specifier> from "pkg[/sub/path]"[;]`
                // {[^}]+} handles multi-line named imports; [^\n{'"…]+ handles default/namespace
                const importRe = new RegExp(`import\\s+(type\\s+)?({[^}]+}|[^\\n{'"]+)\\s+from\\s+["']${escapedPkg}(?:/[^"']*)?["'][ \\t]*;?`, "gm");

                result = result.replace(importRe, (match, isTypeOnly, specifierPart) => {
                    // `import type { … }` — erase entirely
                    if (isTypeOnly) return "";

                    const spec = specifierPart.trim();

                    // `import * as ns from "…"` → `const ns = GLOBAL ?? {};`
                    if (spec.startsWith("*")) {
                        const ns = spec.replace(/^\*\s+as\s+/, "").trim();
                        return `const ${ns} = ${globalChain} ?? {};`;
                    }

                    // `import { X, type Y, Z as W } from "…"` → `const { X, Z: W } = GLOBAL ?? {};`
                    if (spec.startsWith("{")) {
                        const inner = spec.slice(1, spec.lastIndexOf("}"));
                        const names = inner
                            .split(",")
                            .map((n) => n.trim())
                            .filter((n) => n && !/^\s*$/.test(n) && !n.startsWith("type "))
                            // TypeScript `X as Y` → JS destructuring `X: Y`
                            .map((n) => n.replace(/\s+as\s+(\w+)/, ": $1"));
                        if (names.length === 0) return ""; // all names were type-only
                        return `const { ${names.join(", ")} } = ${globalChain} ?? {};`;
                    }

                    // `import X from "…"` → `const X = GLOBAL ?? {};`
                    return `const ${spec} = ${globalChain} ?? {};`;
                });
            }

            return result !== code ? { code: result, map: null } : null;
        },
    };
}

// ---------------------------------------------------------------------------
// Main configuration factory
// ---------------------------------------------------------------------------

/**
 * Creates a Vite configuration for a Babylon.js tool dev server.
 *
 * Dev server strategy: all babylon dev-package imports (core, gui, …) are
 * resolved via `resolve.alias` to their pre-compiled `dist/` or `src/`
 * directories.  Vite serves these as native ESM — no CDN server needed.
 *
 * Production build strategy: babylonjs packages are excluded via
 * `build.rollupOptions.external` + `output.globals` so the bundle remains
 * small and the CDN loader mechanism continues to work for deployed pages.
 *
 * @param {object} options
 * @param {number} options.port                Dev server port.
 * @param {Record<string,string>} options.aliases
 *   Alias entries: key = bare module prefix, value = absolute path to resolve.
 *   E.g. `{ "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src") }`
 * @param {string} [options.publicDir]          Static file directory (Vite publicDir).
 * @param {boolean} [options.enableHttps]      Enable HTTPS for the dev server.
 * @param {boolean} [options.enableHmr]        Enable HMR (defaults true).
 * @param {Record<string,string>} [options.productionExternals]
 *   Externals for `vite build`: map from module ID to global variable.
 *   E.g. `{ babylonjs: "BABYLON", "babylonjs-gui": "BABYLON.GUI" }`
 * @param {Record<string,string>} [options.cdnExternals]
 *   When set, activates CDN-bootstrap mode: these dev-package imports (e.g.
 *   `{ core: "BABYLON", gui: "BABYLON.GUI" }`) are rewritten at transform time
 *   to `globalThis.BABYLON` accesses via babylonDevExternalsPlugin, matching
 *   the architecture where Babylon is loaded from babylonServer (port 1337).
 *   Side-effect imports (`import "core/..."`) are also dropped automatically.
 * @param {string} [options.outDir]            Production build output dir (default: "dist").
 */
export function commonDevViteConfiguration(options) {
    const { port, aliases = {}, publicDir = "public", enableHttps = false, enableHmr = true, productionExternals = {}, cdnExternals = null, outDir = "dist" } = options;

    // Resolve all alias values to absolute paths
    const resolvedAliases = Object.fromEntries(Object.entries(aliases).map(([key, value]) => [key, resolve(value)]));

    const plugins = [react(), cssModuleNamespaceInteropPlugin()];
    if (cdnExternals && Object.keys(cdnExternals).length > 0) {
        plugins.push(babylonDevExternalsPlugin(cdnExternals));
    }

    return {
        plugins,

        // Use relative base so that built HTML asset references (script/link) are relative
        // to the HTML file's location rather than absolute from the domain root.
        // This allows deployment at arbitrary sub-paths (e.g. /PLAYGROUND/refs/pull/N/merge/)
        // without assets 404-ing at the root (/assets/... instead of /PLAYGROUND/.../assets/...).
        base: "./",

        resolve: {
            alias: resolvedAliases,
            extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".scss", ".css"],
        },

        css: {
            // Vite handles SCSS, CSS modules, and plain CSS natively (requires `sass` package).
            // Use Vite's default hash-based scoped names — guaranteed valid and consistent.
            // A custom generateScopedName can break if Vite passes filenames with query
            // strings (e.g. ?used&lang.module.scss), producing invalid CSS selectors.
        },

        server: {
            port,
            https: enableHttps || false,
            hmr: enableHmr,
            // Allow the dev server to be reached from network (mirrors allowedHosts: all)
            host: "::",
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            fs: {
                // Allow serving files from outside the project root (needed for monorepo aliases)
                allow: ["../.."],
            },
        },

        // Tell Vite where to find static assets (mirrors webpack devServer.static)
        publicDir,

        build: {
            outDir,
            sourcemap: true,
            rollupOptions: {
                external: Object.keys(productionExternals),
                output: {
                    globals: productionExternals,
                },
            },
        },

        // Tell Vite to pre-bundle only the deps it needs, not the whole monorepo
        optimizeDeps: {
            // Exclude local workspace packages from pre-bundling (they are aliased to src/dist).
            // Also exclude CDN-externalized packages — their `dist/` files contain bare specifiers
            // (e.g. `core/Engines/...`) that the dep optimizer's esbuild scan can't resolve.
            // The babylonDevExternalsPlugin transform rewrites them at serve time.
            exclude: [...Object.keys(aliases), ...(cdnExternals ? Object.keys(cdnExternals) : [])],
        },
    };
}
