const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
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
                    // publicPath: "public/",
                    languages: ["typescript", "javascript"],
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
                enableFastRefresh: !production,
            }),
        },
    };
    return commonConfig;
};
