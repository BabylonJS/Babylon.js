const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        entry: "./src/app.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "babylon.smartFilterEditor.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.SFE_PORT || 1346,
            }
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", "*.svg"],
            alias: {
                "core/*": path.resolve("../../dev/core/dist/*"),
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
                "smart-filters": path.resolve("../../dev/smartFilters/dist"),
                "smart-filters-blocks": path.resolve("../../dev/smartFilterBlocks/dist"),
                "smart-filters-editor-control": path.resolve("../../tools/smartFiltersEditorControl/dist"),
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
        plugins: [],
    };
    return commonConfig;
};
