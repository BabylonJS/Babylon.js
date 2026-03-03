import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import path from "path";

// Aliases to map dev package names to their public @babylonjs/ equivalents.
// Previously this was handled by ts-patch during TypeScript compilation;
// now we do it at the rollup level.
const devToPublicAliases = [
    { find: "core", replacement: "@babylonjs/core" },
    { find: "gui", replacement: "@babylonjs/gui" },
    { find: "loaders", replacement: "@babylonjs/loaders" },
    { find: "materials", replacement: "@babylonjs/materials" },
    { find: "addons", replacement: "@babylonjs/addons" },
];

// Append .js extension to @babylonjs/ subpath imports for ESM compatibility
const appendJsToExternalPaths = (id) => {
    if (/^@babylonjs\/[^/]+\/.+/.test(id) && !id.endsWith(".js")) {
        return id + ".js";
    }
    return id;
};

const commonConfig = {
    input: "../../../dev/inspector-v2/src/index.ts",
    external: (id) => {
        // Check for @babylonjs packages - these should be external
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
        paths: appendJsToExternalPaths,
    },
    plugins: [
        alias({
            entries: [
                // shared-ui-components is resolved to its source dir for bundling (not external)
                { find: "shared-ui-components", replacement: path.resolve("../../../dev/sharedUiComponents/src") },
                ...devToPublicAliases,
            ],
        }),
        typescript({ tsconfig: "tsconfig.build.lib.json" }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
    ],
    onwarn(warning, warn) {
        // Treat all other warnings as errors.
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
    plugins: [
        alias({
            entries: [{ find: "shared-ui-components", replacement: path.resolve("../../../dev/sharedUiComponents/src") }, ...devToPublicAliases],
        }),
        dts({ tsconfig: "tsconfig.build.lib.json" }),
    ],
};

export default [jsConfig, dtsConfig];
