import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { rewriteDevImports, appendJsToExternalPaths } from "../../rollupUtils.mjs";

// Map dev package names to their public @babylonjs/ equivalents.
const devPackageMap = {
    core: "@babylonjs/core",
    loaders: "@babylonjs/loaders",
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
    plugins: [rewriteDevImports(devPackageMap), typescript({ tsconfig: "tsconfig.build.lib.json" }), nodeResolve({ mainFields: ["browser", "module", "main"] })],
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
    plugins: [rewriteDevImports(devPackageMap), dts({ tsconfig: "tsconfig.build.lib.json" })],
};

export default [jsConfig, dtsConfig];
