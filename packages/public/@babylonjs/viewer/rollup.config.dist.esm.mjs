import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import terser from "@rollup/plugin-terser";
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";
import Sonda from "sonda/rollup";

const source = "dev";

const commonConfig = {
    input: "../../../tools/viewer/src/full/index.ts",
    output: {
        dir: "dist",
        sourcemap: true,
        format: "es",
        exports: "named",
    },
    plugins: [
        typescript({ tsconfig: "tsconfig.build.dist.json" }),
        alias({
            entries: [
                { find: "core", replacement: `@${source}/core/dist` },
                { find: "loaders", replacement: `@${source}/loaders/dist` },
                { find: "materials", replacement: `@${source}/materials/dist` },
            ],
        }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
    ],
    onwarn(warning, warn) {
        // Treat all warnings as errors.
        throw new Error(warning.message);
    },
};

const liteCommonConfig = {
    input: "../../../tools/viewer/src/lite/index.ts",
    output: {
        dir: "dist",
        sourcemap: true,
        format: "es",
        exports: "named",
    },
    plugins: [
        typescript({ tsconfig: "tsconfig.build.dist.json" }),
        alias({
            entries: [{ find: "core", replacement: `@${source}/core/dist` }],
        }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
    ],
    onwarn(warning, warn) {
        throw new Error(warning.message);
    },
};

const maxConfig = {
    ...commonConfig,
    output: {
        ...commonConfig.output,
        entryFileNames: "babylon-viewer.esm.js",
        chunkFileNames: "chunks/[name]-[hash].esm.js",
    },
};

const minConfig = {
    ...commonConfig,
    output: {
        ...commonConfig.output,
        entryFileNames: "babylon-viewer.esm.min.js",
        chunkFileNames: "chunks/[name]-[hash].esm.min.js",
    },
    plugins: [...commonConfig.plugins, terser(), minifyTemplateLiterals()],
};

const liteMaxConfig = {
    ...liteCommonConfig,
    output: {
        ...liteCommonConfig.output,
        entryFileNames: "babylon-viewer-lite.esm.js",
        chunkFileNames: "chunks/[name]-[hash].esm.js",
    },
};

const liteMinConfig = {
    ...liteCommonConfig,
    output: {
        ...liteCommonConfig.output,
        entryFileNames: "babylon-viewer-lite.esm.min.js",
        chunkFileNames: "chunks/[name]-[hash].esm.min.js",
    },
    plugins: [Sonda({ open: false, filename: "viewer-lite-bundle-report.html" }), ...liteCommonConfig.plugins, terser(), minifyTemplateLiterals()],
};

export default [maxConfig, minConfig, liteMaxConfig, liteMinConfig];
