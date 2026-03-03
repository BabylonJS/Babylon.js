import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";

// Aliases to map dev package names to their public @babylonjs/ equivalents.
// Previously this was handled by ts-patch during TypeScript compilation;
// now we do it at the rollup level.
const devToPublicAliases = [
    { find: "core", replacement: "@babylonjs/core" },
    { find: "loaders", replacement: "@babylonjs/loaders" },
];

// Append .js extension to @babylonjs/ subpath imports for ESM compatibility
const appendJsToExternalPaths = (id) => {
    if (/^@babylonjs\/[^/]+\/.+/.test(id) && !id.endsWith(".js")) {
        return id + ".js";
    }
    return id;
};

const commonConfig = {
    input: "../../../tools/viewer/src/index.ts",
    external: (id) => /^@babylonjs\/(core|loaders|materials)(\/|$)/.test(id),
};

const jsConfig = {
    ...commonConfig,
    output: {
        dir: "lib",
        sourcemap: true,
        format: "es",
        exports: "named",
        paths: appendJsToExternalPaths,
    },
    plugins: [
        alias({ entries: devToPublicAliases }),
        typescript({ tsconfig: "tsconfig.build.lib.json" }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
    ],
    onwarn(warning, warn) {
        // Treat all warnings as errors.
        throw new Error(warning.message);
    },
};

const dtsConfig = {
    ...commonConfig,
    output: {
        file: "lib/index.d.ts",
        format: "es",
        paths: appendJsToExternalPaths,
    },
    plugins: [
        alias({ entries: devToPublicAliases }),
        dts({ tsconfig: "tsconfig.build.lib.json" }),
    ],
};

export default [jsConfig, dtsConfig];
