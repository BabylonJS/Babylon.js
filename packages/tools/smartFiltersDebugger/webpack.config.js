const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        entry: {
            background: "./src/background.ts",
            editorLauncher: "./src/editorLauncher.ts",
        },
        ...webpackTools.commonDevWebpackConfiguration({
            ...env,
            outputFilename: "scripts/[name].js",
            dirName: __dirname,
        }),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", "*.svg"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
                "@babylonjs/core/*": path.resolve("../../../node_modules/core-for-sf/*"),
                "@babylonjs/smart-filters": path.resolve("../../dev/smartFilters/dist"),
                "@babylonjs/smart-filters-blocks": path.resolve("../../dev/smartFilterBlocks/dist"),
                "@babylonjs/smart-filters-editor-control": path.resolve("../../tools/smartFiltersEditorControl/dist"),
            },
        },
        externals: [],
        module: {
            rules: webpackTools.getRules({
                includeCSS: true,
                includeAssets: true,
                sideEffects: true,
                tsOptions: {
                    compilerOptions: {
                        rootDir: "../../",
                    },
                },
                mode: production ? "production" : "development",
            }),
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: "./src/assets/manifest.json", to: "./manifest.json" },
                    { from: "./src/assets/icons", to: "./icons" },
                ],
            }),
        ],
    };
    return commonConfig;
};
