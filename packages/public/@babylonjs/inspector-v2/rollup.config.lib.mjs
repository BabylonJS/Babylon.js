import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import path from "path";

// Map dev package names to their public @babylonjs/ equivalents.
// Must be ordered longest-first to prevent prefix collisions (e.g. gui vs gui-editor).
const devPackageMap = {
    "gui-editor": "@babylonjs/gui-editor",
    "shared-ui-components": null, // handled by alias plugin below
    serializers: "@babylonjs/serializers",
    materials: "@babylonjs/materials",
    loaders: "@babylonjs/loaders",
    addons: "@babylonjs/addons",
    core: "@babylonjs/core",
    gui: "@babylonjs/gui",
};

// Custom plugin to rewrite bare dev package imports to @babylonjs/ scoped packages
function rewriteDevImports() {
    return {
        name: "rewrite-dev-imports",
        resolveId(source) {
            for (const [pkg, replacement] of Object.entries(devPackageMap)) {
                if (replacement && (source === pkg || source.startsWith(pkg + "/"))) {
                    return { id: replacement + source.slice(pkg.length), external: true };
                }
            }
            return null;
        },
    };
}

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
        paths: appendJsToExternalPaths,
    },
    plugins: [
        rewriteDevImports(),
        alias({ entries: [{ find: "shared-ui-components", replacement: path.resolve("../../../dev/sharedUiComponents/src") }] }),
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
        rewriteDevImports(),
        alias({ entries: [{ find: "shared-ui-components", replacement: path.resolve("../../../dev/sharedUiComponents/src") }] }),
        dts({ tsconfig: "tsconfig.build.lib.json" }),
    ],
};

export default [jsConfig, dtsConfig];
