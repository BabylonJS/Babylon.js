import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";

// Map dev package names to their public @babylonjs/ equivalents.
const devPackageMap = {
    core: "@babylonjs/core",
    loaders: "@babylonjs/loaders",
};

// Custom plugin to rewrite bare dev package imports to @babylonjs/ scoped packages
function rewriteDevImports() {
    return {
        name: "rewrite-dev-imports",
        resolveId(source) {
            for (const [pkg, replacement] of Object.entries(devPackageMap)) {
                if (source === pkg || source.startsWith(pkg + "/")) {
                    return { id: replacement + source.slice(pkg.length), external: true };
                }
            }
            return null;
        },
    };
}

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
    plugins: [rewriteDevImports(), typescript({ tsconfig: "tsconfig.build.lib.json" }), nodeResolve({ mainFields: ["browser", "module", "main"] })],
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
    plugins: [rewriteDevImports(), dts({ tsconfig: "tsconfig.build.lib.json" })],
};

export default [jsConfig, dtsConfig];
