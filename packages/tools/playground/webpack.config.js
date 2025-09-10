const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const base = webpackTools.commonDevWebpackConfiguration(
        {
            ...env,
            outputFilename: "babylon.playground.js",
            dirName: __dirname,
            enableHotReload: true,
        },
        {
            static: ["public"],
            port: process.env.PLAYGROUND_PORT || 1338,
        },
        [
            new MonacoWebpackPlugin({
                languages: ["typescript", "javascript"],
                filename: "static/[name].worker.js",
                publicPath: "/",
            }),
        ]
    );

    return {
        ...base,

        entry: { "babylon.playground": "./src/legacy/legacy.ts" },

        output: {
            ...(base.output || {}),
            path: path.resolve(__dirname, "dist"),
            publicPath: "/",
            filename: "[name].js",
            chunkFilename: "chunks/[name].[contenthash].js",
            assetModuleFilename: "assets/[name][ext]",
            clean: true,
        },

        optimization: {
            ...(base.optimization || {}),
            chunkIds: "deterministic",
            moduleIds: "deterministic",
            splitChunks: {
                ...((base.optimization && base.optimization.splitChunks) || {}),
                chunks: "all",
            },
            runtimeChunk: (base.optimization && base.optimization.runtimeChunk) || "single",
        },

        resolve: {
            ...(base.resolve || {}),
            extensions: [".js", ".ts", ".tsx", ".scss", ".svg"],
            alias: {
                ...(base.resolve && base.resolve.alias ? base.resolve.alias : {}),
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
                "inspector-v2": path.resolve("../../dev/inspector-v2/dist"),
                addons: path.resolve("../../dev/addons/dist"),
                materials: path.resolve("../../dev/materials/dist"),
                core: path.resolve("../../dev/core/dist"),
                loaders: path.resolve("../../dev/loaders/dist"),
                gui: path.resolve("../../dev/gui/dist"),
                serializers: path.resolve("../../dev/serializers/dist"),
            },
        },

        externals: [
            function ({ context, request }, callback) {
                if (/^@dev\/core$/.test(request)) {
                    return callback(null, "BABYLON");
                }
                if (context && context.includes("inspector-v2")) {
                    if (/^core\//.test(request)) {
                        return callback(null, "BABYLON");
                    }
                    if (/^loaders\//.test(request)) {
                        return callback(null, "BABYLON");
                    }
                    if (/^addons\//.test(request)) {
                        return callback(null, "ADDONS");
                    }
                    if (/^materials\//.test(request)) {
                        return callback(null, "BABYLON");
                    }
                    if (/^gui\//.test(request)) {
                        return callback(null, "BABYLON.GUI");
                    }
                }
                callback();
            },
        ],

        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: true,
                extraRules: [
                    { test: /\.ttf$/, type: "asset/resource" },
                    { test: /\.svg$/, use: ["@svgr/webpack"] },
                ],
                tsOptions: {
                    compilerOptions: {
                        rootDir: "../../",
                    },
                },
                enableFastRefresh: !production,
            }),
        },
    };
};
