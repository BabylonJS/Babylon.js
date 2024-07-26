import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";

const source = "dev";

export default {
    input: "src/index.ts",
    output: {
        dir: "dist/analyze",
        // No need for source maps for size analysis
        sourcemap: false,
        // Output as ES module
        format: "es",
        exports: "named",
        // Prevent bundling multiple files into one
        // We want to keep them separate so we can easily see file/folder size
        preserveModules: true,
        preserveModulesRoot: "../../",
    },
    plugins: [
        typescript({ tsconfig: "tsconfig.build.json", sourceMap: false, inlineSources: false, declaration: false, declarationMap: false, outDir: "dist/analyze" }),
        alias({
            entries: [
                { find: "core", replacement: `@${source}/core/dist` },
                { find: "loaders", replacement: `@${source}/loaders/dist` },
            ],
        }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
        terser(),
        visualizer({ filename: "dist/analyze/stats.json", template: "raw-data" }),
    ],
};
