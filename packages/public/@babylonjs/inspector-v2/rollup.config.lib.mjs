import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import path from "path";

const commonConfig = {
    input: "../../../dev/inspector-v2/src/index.ts",
    external: (id) => {
        // Check for @babylonjs packages (transformed by TypeScript) - these should be external
        if (/^@babylonjs\//.test(id)) {
            return true;
        }

        // Check for Fluent UI packages (including @fluentui-contrib)
        if (/^@fluentui(-contrib)?\//.test(id)) {
            return true;
        }

        // Check for React packages (including sub-paths like react/jsx-runtime)
        if (id === "react" || id === "react-dom" || id.startsWith("react/") || id.startsWith("react-dom/")) {
            return true;
        }

        // Check for other external packages
        if (id === "usehooks-ts") {
            return true;
        }

        return false;
    },
};

const jsConfig = {
    ...commonConfig,
    output: {
        dir: "lib",
        sourcemap: true,
        format: "es",
        exports: "named",
    },
    plugins: [
        alias({
            entries: [{ find: "shared-ui-components", replacement: path.resolve("../../../dev/sharedUiComponents/src") }],
        }),
        typescript({ tsconfig: "tsconfig.build.lib.json" }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
    ],
    onwarn(warning, warn) {
        // Ignore warning over "this" being undefined in ES when converting gif.js from UMD to ES.
        if (warning.code === "THIS_IS_UNDEFINED" && warning.loc && warning.loc.file && warning.loc.file.endsWith("node_modules/gif.js.optimized/dist/gif.js")) {
            return;
        }

        // Treat all other warnings as errors.
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
