import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const commonPlugins = [
    typescript({ tsconfig: "tsconfig.cli.json" }),
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
];

const cliConfig = {
    input: "../../../dev/inspector-v2/src/cli/cli.ts",
    output: {
        file: "bin/inspector-cli.mjs",
        format: "es",
        sourcemap: false,
        banner: "#!/usr/bin/env node\n",
    },
    plugins: commonPlugins,
    onwarn(warning, warn) {
        // Treat all other warnings as errors.
        throw new Error(warning.message);
    },
};

const bridgeConfig = {
    input: "../../../dev/inspector-v2/src/cli/bridge.ts",
    output: {
        file: "bin/inspector-bridge.mjs",
        format: "es",
        sourcemap: false,
    },
    plugins: commonPlugins,
    onwarn(warning, warn) {
        // Treat all other warnings as errors.
        throw new Error(warning.message);
    },
};

export default [cliConfig, bridgeConfig];
