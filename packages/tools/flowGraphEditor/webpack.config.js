const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "babylon.flowGraphEditor.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.FGE_PORT || 1345,
            }
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", ".svg"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
                "@tools/snippet-loader": path.resolve("../snippetLoader/dist"),
            },
        },
        externals: [
            function ({ _context, request }, callback) {
                if (/^core\//.test(request)) {
                    return callback(null, "BABYLON");
                }
                callback();
            },
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
