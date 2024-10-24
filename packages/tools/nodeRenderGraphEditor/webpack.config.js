const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "babylon.nodeRenderGraphEditor.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.NRGE_PORT || 1344,
            }
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", "*.svg"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
                serializers: path.resolve("../../dev/serializers/dist"),
                gui: path.resolve("../../dev/gui/dist"),
            },
        },
        externals: [
            function ({ _context, request }, callback) {
                if (/^core\//.test(request)) {
                    // Externalize to a commonjs module using the request path
                    return callback(null, "BABYLON");
                }

                // Continue without externalizing the import
                callback();
            },
            // TODO add externals for production build vs. serve
            // React, react dom etc'
        ],
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
