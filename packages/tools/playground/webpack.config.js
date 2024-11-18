const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

module.exports = (env) => {
    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "babylon.playground.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.PLAYGROUND_PORT || 1338,
            }
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", "*.svg"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            },
        },
        externals: {
            "@dev/core": "BABYLON",
        },
        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: true,
                extraRules: [
                    {
                        test: /\.ttf$/,
                        type: "asset/resource",
                    },
                    {
                        test: /\.svg$/,
                        use: ["@svgr/webpack"],
                    },
                ],
                tsOptions: {
                    compilerOptions: {
                        rootDir: "../../",
                    },
                },
            }),
        },
        plugins: [
            new MonacoWebpackPlugin({
                // publicPath: "public/",
                languages: ["typescript", "javascript"],
            }),
        ],
    };
    return commonConfig;
};
