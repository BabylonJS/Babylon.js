import typescript from "@rollup/plugin-typescript";
//import terser from "@rollup/plugin-terser";
import { dts } from "rollup-plugin-dts";

const jsConfig = {
    input: "../../../tools/viewer-alpha/src/index.ts",
    output: {
        dir: "lib",
        sourcemap: true,
        format: "es",
        exports: "named",
    },
    plugins: [typescript({ tsconfig: "tsconfig.build.json" })],
};

const dtsConfig = {
    input: "../../../tools/viewer-alpha/src/index.ts",
    output: {
        file: "lib/index.d.ts",
        format: "es",
    },
    plugins: [dts({ tsconfig: "tsconfig.build.json" })],
};

export default [jsConfig, dtsConfig];
