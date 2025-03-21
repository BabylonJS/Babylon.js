const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

module.exports = (env) => {
    return {
        entry: "./src/index.tsx",

        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "index.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.VIEWER_CONFIGURATOR_PORT || 3003,
            }
        ),

        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss"],
            alias: {
                core: path.resolve("../../dev/core/dist"),
                loaders: path.resolve("../../dev/loaders/dist"), // "src" results in unknown babylonjs-gltf2interface
                viewer: path.resolve("../../tools/viewer/dist/tsbuild"), // "src" results in runtime viewer error
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            },
        },

        module: {
            rules: webpackTools.getRules({
                includeAssets: true,
                includeCSS: true,
                sideEffects: true,
                tsOptions: {
                    transpileOnly: true,
                    compilerOptions: {
                        declaration: false,
                    },
                },
            }),
        },

        optimization: {
            usedExports: true,
        },
    };
};
