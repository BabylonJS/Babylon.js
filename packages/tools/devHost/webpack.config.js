const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const source = env.source || process.env.SOURCE || "dev";
    const commonConfig = {
        entry: "./src/index.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "main.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.TOOLS_PORT || 1338,
            }
        ),
        resolve: {
            extensions: [".ts", ".js"],
            alias: {
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
                gui: `@${source}/gui/dist`,
                serializers: `@${source}/serializers/dist`,
                inspector: `@dev/inspector/dist`,
                "shared-ui-components": `@dev/shared-ui-components/dist`,
                materials: `@${source}/materials/dist`,
                "post-processes": `@${source}/post-processes/dist`,
                "procedural-textures": `@${source}/procedural-textures/dist`,
                "gui-editor": `@tools/gui-editor/dist`,
                "node-editor": `@tools/node-editor/dist`,
            },
        },
        experiments: {
            outputModule: true,
        },
        module: {
            rules: webpackTools.getRules(),
        },
        plugins: [
            new HtmlWebpackPlugin({
                inject: true,
                template: path.resolve("./public/index.html"),
                scriptLoading: "module",
            }),
        ],
    };
    return commonConfig;
};
