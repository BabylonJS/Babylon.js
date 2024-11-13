import path from "path";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import terser from "@rollup/plugin-terser";
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";
import scss from "rollup-plugin-scss";
import url from "@rollup/plugin-url";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

const source = "dev";

const commonConfig = {
    input: "../../../tools/viewer-alpha/src/index.ts",
    output: {
        dir: "dist",
        sourcemap: true,
        format: "es",
        exports: "named",
    },
    plugins: [
        typescript({ tsconfig: "tsconfig.build.dist.json" }),
        alias({
            entries: [
                { find: "core", replacement: `@${source}/core/dist` },
                { find: "loaders", replacement: `@${source}/loaders/dist` },
                { find: "materials", replacement: `@${source}/materials/dist` },
                { find: "serializers", replacement: `@${source}/serializers/dist` },
                { find: "inspector", replacement: `@${source}/inspector/dist` },
                { find: "gui", replacement: `@${source}/gui/dist` },
                { find: "shared-ui-components", replacement: path.resolve("../../../dev/sharedUiComponents/dist") },
                { find: "gui-editor", replacement: path.resolve("../../../tools/guiEditor/dist") },
            ],
        }),
        nodeResolve({ mainFields: ["browser", "module", "main"] }),
        commonjs(),
        scss({
            output: "dist/babylon-viewer.css",
            //outputStyle: "compressed",
            sourceMap: true,
            processor: (css) =>
                postcss([autoprefixer()])
                    .process(css)
                    .then((result) => result.css),
            modules: {
                generateScopedName: "[name]__[local]___[hash:base64:5]", // Enable CSS modules
            },
        }),
        url({
            include: ["**/*.svg"],
            limit: 0,
        }),
    ],
};

const maxConfig = {
    ...commonConfig,
    output: {
        ...commonConfig.output,
        entryFileNames: "babylon-viewer.esm.js",
        chunkFileNames: "chunks/[name]-[hash].esm.js",
    },
};

const minConfig = {
    ...commonConfig,
    output: {
        ...commonConfig.output,
        entryFileNames: "babylon-viewer.esm.min.js",
        chunkFileNames: "chunks/[name]-[hash].esm.min.js",
    },
    plugins: [...commonConfig.plugins, terser(), minifyTemplateLiterals()],
};

export default [maxConfig, minConfig];
