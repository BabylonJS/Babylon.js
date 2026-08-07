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
    input: "../../../tools/viewer/src/full/index.ts",
    external: (id) => /^@babylonjs\/(core|loaders|materials)(\/|$)/.test(id),
};

const liteCommonConfig = {
    input: "../../../tools/viewer/src/lite/index.ts",
    external: (id) => /^@babylonjs\/(core|lite)(\/|$)/.test(id),
};

const jsConfig = {
    ...commonConfig,
    output: {
        dir: "lib/full",
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
        file: "lib/full/index.d.ts",
        format: "es",
        paths: appendJsToExternalPaths,
    },
    plugins: [rewriteDevImports(devPackageMap), dts({ tsconfig: "tsconfig.build.lib.json" })],
};

const liteJsConfig = {
    ...liteCommonConfig,
    output: {
        dir: "lib/lite",
        sourcemap: true,
        format: "es",
        exports: "named",
        paths: appendJsToExternalPaths,
    },
    plugins: [rewriteDevImports(devPackageMap), typescript({ tsconfig: "tsconfig.build.lib.lite.json" }), nodeResolve({ mainFields: ["browser", "module", "main"] })],
    onwarn(warning, warn) {
        throw new Error(warning.message);
    },
};

const liteDtsConfig = {
    ...liteCommonConfig,
    output: {
        file: "lib/lite/index.d.ts",
        format: "es",
        paths: appendJsToExternalPaths,
    },
    plugins: [rewriteDevImports(devPackageMap), dts({ tsconfig: "tsconfig.build.lib.lite.json" })],
};

export default [jsConfig, dtsConfig, liteJsConfig, liteDtsConfig];
