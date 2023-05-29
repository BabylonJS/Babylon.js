const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const source = env.source || process.env.SOURCE || "dev";
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        mode: env.mode === "production" ? "production" : "development",
        devtool: production ? "source-map" : "eval-cheap-module-source-map",
        entry: "./src/index.ts",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "main.js",
            // library: { type: "module" },
            // environment: { module: true },
            // module: true,
            devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
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
        // externalsType: "module",
        // externals: [
        //     function ({ context, request }, callback) {
        //         if (/^core\//.test(request)) {
        //             // Externalize to a commonjs module using the request path
        //             const changed = request.replace(/^core\//, "core/dist/");
        //             return callback(null, "../../dev/" + changed + ".js");
        //         }

        //         // Continue without externalizing the import
        //         callback();
        //     },
        // ],
        module: {
            rules: webpackTools.getRules(),
        },
        devServer: {
            static: ["public"],
            port: process.env.TOOLS_PORT || 1338,
            server: env.enableHttps !== undefined || process.env.ENABLE_HTTPS === "true" ? "https" : "http",
            hot: (env.enableHotReload !== undefined || process.env.ENABLE_HOT_RELOAD === "true") && !production ? true : false,
            liveReload: (env.enableLiveReload !== undefined || process.env.ENABLE_LIVE_RELOAD === "true") && !production ? true : false,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
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
