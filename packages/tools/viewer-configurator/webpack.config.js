// const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

const outputDirectoryForAliases = "dist"; // TODO: Errors using "src" here
const basePathForDev = path.resolve(__dirname, "../../", "dev");
const basePathForTools = path.resolve(__dirname, "../../", "tools");

module.exports = (env) => {
    const commonConfig = {
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
            extensions: [".js", ".ts", ".tsx"],
            alias: {
                core: path.resolve(basePathForDev, "core", outputDirectoryForAliases),
                viewer: path.resolve(basePathForTools, "viewer", outputDirectoryForAliases, "tsbuild"),
                loaders: path.resolve(basePathForDev, "loaders", outputDirectoryForAliases),
                "shared-ui-components": path.resolve(basePathForDev, "sharedUiComponents", outputDirectoryForAliases),
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
    return commonConfig;
};
