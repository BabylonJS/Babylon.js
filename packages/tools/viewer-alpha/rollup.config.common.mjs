import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";

const source = "dev";

export function createConfig(outDir) {
    return {
        input: "src/index.ts",
        output: {
            dir: outDir,
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
            typescript({ tsconfig: "tsconfig.build.json", sourceMap: false, inlineSources: false, declaration: false, declarationMap: false, outDir }),
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
}
