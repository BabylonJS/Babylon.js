const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const BUILD_ID = process.env.BUILD_BUILDID || process.env.BUILD_SOURCEVERSION || String(Date.now());
    // eslint-disable-next-line no-console
    console.log(`Building playground in ${production ? "production" : "development"} mode using build id: ${BUILD_ID}`);
    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration(
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
                    filename: "[name].[contenthash].worker.js",
                }),
            ]
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", "*.svg"],
            alias: {
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

                if (context.includes("inspector-v2") || context.includes("sharedUiComponents")) {
                    if (/^core\//.test(request)) {
                        return callback(null, "BABYLON");
                    } else if (/^loaders\//.test(request)) {
                        return callback(null, "BABYLON");
                    } else if (/^addons\//.test(request)) {
                        return callback(null, "ADDONS");
                    } else if (/^materials\//.test(request)) {
                        return callback(null, "BABYLON");
                    } else if (/^gui\//.test(request)) {
                        return callback(null, "BABYLON.GUI");
                    }
                }

                // Continue without externalizing the import
                callback();
            },
        ],
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
    };
    const plugins = (commonConfig.plugins || []).filter((p) => !(p && p.constructor && p.constructor.name === "ReactRefreshWebpackPlugin"));
    return {
        ...commonConfig,
        output: {
            ...(commonConfig.output || {}),
            filename: `babylon.playground.[fullhash].js`,
            chunkFilename: `[name].[fullhash].js`,
            assetModuleFilename: `assets/[name].[fullhash][ext]`,
            hashSalt: BUILD_ID,
            publicPath: commonConfig.output?.publicPath ?? "auto",
        },
        devServer: {
            ...(commonConfig.devServer || {}),
            client: {
                ...(commonConfig.devServer?.client || {}),
                overlay: false,
            },
        },
        plugins: [
            ...plugins,
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "debug.html"),
                filename: "debug.html",
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "frame.html"),
                filename: "frame.html",
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "full.html"),
                filename: "full.html",
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "index.html"),
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            !production && new ReactRefreshWebpackPlugin({ overlay: false }),
        ].filter(Boolean),
    };
};
