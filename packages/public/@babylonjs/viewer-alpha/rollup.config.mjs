import typescript from "@rollup/plugin-typescript";
//import terser from "@rollup/plugin-terser";
import { dts } from "rollup-plugin-dts";

const commonConfig = {
    input: "../../../tools/viewer-alpha/src/index.ts",
};

const jsConfig = {
    ...commonConfig,
    output: {
        dir: "lib",
        sourcemap: true,
        format: "es",
        exports: "named",
    },
    plugins: [typescript({ tsconfig: "tsconfig.build.json" })],
};

const dtsConfig = {
    ...commonConfig,
    output: {
        file: "lib/index.d.ts",
        format: "es",
    },
    plugins: [dts({ tsconfig: "tsconfig.build.json" })],
};

export default [jsConfig, dtsConfig];
