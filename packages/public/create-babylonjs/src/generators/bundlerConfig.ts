import type { ProjectOptions } from "../index";

interface BundlerConfigResult {
    filename: string;
    content: string;
}

function viteConfig(options: ProjectOptions): BundlerConfigResult {
    const filename = options.language === "ts" ? "vite.config.ts" : "vite.config.js";
    const content = `import { defineConfig } from "vite";

export default defineConfig({
    // https://vitejs.dev/config/
});
`;
    return { filename, content };
}

function webpackConfig(options: ProjectOptions): BundlerConfigResult {
    const { language } = options;
    const ext = language === "ts" ? "ts" : "js";
    const filename = "webpack.config.js";

    const tsRule =
        language === "ts"
            ? `
            {
                test: /\\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },`
            : "";

    const resolve =
        language === "ts"
            ? `
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },`
            : "";

    const content = `const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: "./src/index.${ext}",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },${resolve}
    module: {
        rules: [${tsRule}
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html",
        }),
    ],
    devServer: {
        static: "./dist",
        hot: true,
        open: true,
    },
};
`;
    return { filename, content };
}

function rollupConfig(options: ProjectOptions): BundlerConfigResult {
    const { language } = options;
    const ext = language === "ts" ? "ts" : "js";
    const filename = "rollup.config.mjs";

    const tsImport = language === "ts" ? `import typescript from "@rollup/plugin-typescript";\n` : "";
    const tsPlugin = language === "ts" ? `        typescript(),\n` : "";

    const content = `import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
${tsImport}import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";

const production = process.env.BUILD === "production";

export default {
    input: "src/index.${ext}",
    output: {
        file: "dist/bundle.js",
        format: "iife",
        sourcemap: !production,
    },
    plugins: [
        resolve({ browser: true }),
        commonjs(),
${tsPlugin}        !production && serve({
            open: true,
            contentBase: ["", "dist"],
            port: 3000,
        }),
        !production && livereload("dist"),
    ],
};
`;
    return { filename, content };
}

export function generateBundlerConfig(options: ProjectOptions): BundlerConfigResult | null {
    switch (options.bundler) {
        case "vite":
            return viteConfig(options);
        case "webpack":
            return webpackConfig(options);
        case "rollup":
            return rollupConfig(options);
        case "none":
            return null;
    }
}
