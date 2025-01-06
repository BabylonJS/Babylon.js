import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const commonConfig = {
    input: "../../../tools/viewer/src/index.ts",
    external: (id) => /^@babylonjs\/(core|loaders)(\/|$)/.test(id),
};

const jsConfig = {
    ...commonConfig,
    output: {
        dir: "lib",
        sourcemap: true,
        format: "es",
        exports: "named",
    },
    plugins: [typescript({ tsconfig: "tsconfig.build.lib.json" }), nodeResolve({ mainFields: ["browser", "module", "main"] })],
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
    },
    plugins: [dts({ tsconfig: "tsconfig.build.lib.json" })],
};

export default [jsConfig, dtsConfig];
