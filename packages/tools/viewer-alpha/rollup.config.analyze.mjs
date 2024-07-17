import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import terser from "@rollup/plugin-terser";

const source = "dev";

export default {
    input: "src/index.ts",
    output: {
        dir: "dist/analyze/loose",
        sourcemap: false,
        format: "es",
        exports: "named",
        preserveModules: true,
        preserveModulesRoot: "../../",
    },
    plugins: [
        typescript({ tsconfig: "tsconfig.build.json", sourceMap: false, inlineSources: false, declaration: false, declarationMap: false, outDir: "dist/analyze/loose" }),
        alias({
            entries: [
                { find: "core", replacement: `@${source}/core/dist` },
                { find: "loaders", replacement: `@${source}/loaders/dist` },
            ],
        }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
        terser(),
    ],
};
