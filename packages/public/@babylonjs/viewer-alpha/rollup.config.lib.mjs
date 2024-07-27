import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

const commonConfig = {
    input: "../../../tools/viewer-alpha/src/index.ts",
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
    plugins: [typescript({ tsconfig: "tsconfig.build.lib.json" })],
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
