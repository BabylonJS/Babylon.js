const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "babylon.guiEditor.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.GUIEDITOR_PORT || 1341,
            }
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".svg", "*.scss"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            },
        },
        externals: [
            function ({ _context, request }, callback) {
                if (/^core\//.test(request)) {
                    // Externalize to a commonjs module using the request path
                    return callback(null, "BABYLON");
                } else if (/^gui\//.test(request)) {
                    return callback(null, "BABYLON.GUI");
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
            }),
        },
        plugins: [],
    };
    return commonConfig;
};
