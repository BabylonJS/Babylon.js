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
            extensions: [".ts", ".tsx", ".js", ".jsx", ".svg", ".scss"],
            alias: {
                addons: path.resolve("../../dev/addons/dist"),
                core: path.resolve("../../dev/core/dist"),
                gui: path.resolve("../../dev/gui/dist"),
                loaders: path.resolve("../../dev/loaders/dist"),
                materials: path.resolve("../../dev/materials/dist"),
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
                inspector: path.resolve("./src"),
                serializers: path.resolve("../../dev/serializers/dist"),
                "node-editor": path.resolve("../../tools/nodeEditor/dist"),
                "node-geometry-editor": path.resolve("../../tools/nodeGeometryEditor/dist"),
                "node-particle-editor": path.resolve("../../tools/nodeParticleEditor/dist"),
                "node-render-graph-editor": path.resolve("../../tools/nodeRenderGraphEditor/dist"),
                "gui-editor": path.resolve("../../tools/guiEditor/dist"),
            },
        },

        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: true,
                extraRules: [
                    {
                        test: /\.svg$/,
                        type: "asset/inline",
                    },
                ],
                enableFastRefresh: !production,
                tsOptions: {
                    configFile: "tsconfig.build.json",
                    transpileOnly: true,
                },
            }),
        },
    };
};
