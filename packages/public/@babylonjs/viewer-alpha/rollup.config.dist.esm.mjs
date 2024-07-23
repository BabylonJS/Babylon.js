import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import terser from "@rollup/plugin-terser";

const source = "dev";

const commonConfig = {
    input: "../../../tools/viewer-alpha/src/index.ts",
    output: {
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
            ],
        }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
    ],
};

const maxConfig = {
    ...commonConfig,
    output: {
        ...commonConfig.output,
        file: "dist/babylon-viewer.esm.js",
    }
};

const minConfig = {
    ...commonConfig,
    output: {
        ...commonConfig.output,
        file: "dist/babylon-viewer.esm.min.js",
    },
    plugins: [
        ...commonConfig.plugins,
        terser(),
    ]
};

export default [maxConfig, minConfig];
