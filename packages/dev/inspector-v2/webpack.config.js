const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    return {
        entry: "./test/app/index.tsx",

        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "bundle.js",
                dirName: __dirname,
                enableHotReload: true,
            },
            {
                static: ["test/app"],
                port: process.env.INSPECTOR_TEST_PORT || 9001,
            }
        ),

        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            alias: {
                addons: path.resolve("../../dev/addons/dist"),
                core: path.resolve("../../dev/core/dist"),
                gui: path.resolve("../../dev/gui/dist"),
                loaders: path.resolve("../../dev/loaders/dist"),
                materials: path.resolve("../../dev/materials/dist"),
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
                "inspector-v2": path.resolve("./src"),
                serializers: path.resolve("../../dev/serializers/dist"),
            },
        },

        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: false,
                enableFastRefresh: !production,
                tsOptions: {
                    configFile: "tsconfig.build.json",
                    transpileOnly: true,
                },
            }),
        },
    };
};
