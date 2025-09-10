const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const standalone = env.mode === "standalone" || process.env.NODE_ENV === "standalone";

    const aliasDist = standalone
        ? {
              "shared-ui-components": "@dev/shared-ui-components",
              "inspector-v2": "@dev/inspector-v2",
              addons: "@dev/addons",
              materials: "@dev/materials",
              core: "@dev/core",
              loaders: "@dev/loaders",
              gui: "@dev/gui",
              serializers: "@dev/serializers",
          }
        : {
              "shared-ui-components": path.resolve(__dirname, "../../dev/sharedUiComponents/dist"),
              "inspector-v2": path.resolve(__dirname, "../../dev/inspector-v2/dist"),
              addons: path.resolve(__dirname, "../../dev/addons/dist"),
              materials: path.resolve(__dirname, "../../dev/materials/dist"),
              core: path.resolve(__dirname, "../../dev/core/dist"),
              loaders: path.resolve(__dirname, "../../dev/loaders/dist"),
              gui: path.resolve(__dirname, "../../dev/gui/dist"),
              serializers: path.resolve(__dirname, "../../dev/serializers/dist"),
          };

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
            extensions: [".js", ".ts", ".tsx", ".scss", ".svg"],
            alias: aliasDist,
        },
        externals: [
            function ({ context, request }, callback) {
                if (/^@dev\/core$/.test(request)) {
                    return callback(null, "BABYLON");
                }

                if (context.includes("inspector-v2")) {
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
