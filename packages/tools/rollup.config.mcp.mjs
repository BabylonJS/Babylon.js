/**
 * Shared rollup configuration for all Babylon.js MCP servers.
 *
 * Each server imports this and calls `createConfig("./src/index.ts")`
 * to produce a single self-contained, minified ESM bundle at dist/index.js
 * with no external dependencies (only Node built-ins are external).
 */

import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { builtinModules } from "node:module";
import { transform } from "esbuild";

/**
 * Strip shebang lines from source so the banner is the only one.
 * @returns A Rollup plugin that removes source shebangs.
 */
function stripShebang() {
    return {
        name: "strip-shebang",
        transform(code, id) {
            if (code.startsWith("#!")) {
                return { code: code.replace(/^#![^\n]*\n/, ""), map: null };
            }
            return null;
        },
    };
}

/**
 * Minify bundled chunks using esbuild (handles modern JS incl. private fields).
 * @returns A Rollup plugin that minifies chunks with esbuild.
 */
function esbuildMinify() {
    return {
        name: "esbuild-minify",
        async renderChunk(code) {
            const result = await transform(code, {
                minify: true,
                target: "node18",
                format: "esm",
            });
            return { code: result.code, map: result.map || null };
        },
    };
}

/**
 * Resolve zod-to-json-schema's v3 compatibility import to the installed zod package.
 * @returns A Rollup plugin that aliases zod/v3 imports.
 */
function zodV3CompatAlias() {
    return {
        name: "zod-v3-compat-alias",
        async resolveId(source, importer, options) {
            if (source !== "zod/v3") {
                return null;
            }
            return await this.resolve("zod", importer, { ...options, skipSelf: true });
        },
    };
}

function isKnownDependencyCircularWarning(warning) {
    if (warning.code !== "CIRCULAR_DEPENDENCY") {
        return false;
    }

    const ids = warning.ids ?? [warning.message ?? ""];
    return ids.some((id) => id.includes("/node_modules/zod") || id.includes("/node_modules/zod-to-json-schema"));
}

/** Node built-in modules that must stay external (e.g. "fs", "node:fs"). */
const nodeBuiltins = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

/**
 * Modules that should remain external even though they appear in
 * dependency code. The snippet-loader lazy-imports Monaco's TypeScript
 * services for playground transpilation — MCP servers never trigger that
 * code path (they only load data snippets), so we exclude it.
 */
const alwaysExternal = [...nodeBuiltins, /^monaco-editor/];

/**
 * @param input Entry point relative to the server package root.
 * @returns The Rollup options for an MCP server package.
 */
export function createConfig(input = "./src/index.ts") {
    return {
        input,
        onwarn(warning, defaultHandler) {
            if (isKnownDependencyCircularWarning(warning)) {
                return;
            }
            defaultHandler(warning);
        },
        output: {
            file: "dist/index.js",
            format: "es",
            sourcemap: true,
            // Preserve the shebang so `npx` / `bin` invocation still works.
            banner: "#!/usr/bin/env node",
        },
        external: alwaysExternal,
        plugins: [
            stripShebang(),
            typescript({
                tsconfig: "./tsconfig.json",
                // Declarations are not needed in the bundle.
                declaration: false,
                declarationMap: false,
            }),
            zodV3CompatAlias(),
            nodeResolve({ preferBuiltins: true }),
            commonjs(),
            json(),
            esbuildMinify(),
        ],
    };
}
