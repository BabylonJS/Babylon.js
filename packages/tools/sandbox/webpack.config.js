const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "babylon.sandbox.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.SANDBOX_PORT || 1339,
            }
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
                "inspector-v2": path.resolve("../../dev/inspector-v2/dist"),
            },
        },
        externals: [
            function ({ _context, request }, callback) {
                if (/^core\//.test(request)) {
                    // Externalize to a commonjs module using the request path
                    return callback(null, "BABYLON");
                } else if (/^inspector\//.test(request)) {
                    return callback(null, "BABYLON");
                } else if (/^loaders\//.test(request)) {
                    return callback(null, "BABYLON");
                } else if (/^materials\//.test(request)) {
                    return callback(null, "BABYLON");
                } else if (/^gui\//.test(request)) {
                    return callback(null, "BABYLON.GUI");
                } else if (/^serializers\//.test(request)) {
                    return callback(null, "BABYLON");
                } else if (/^gui-editor\//.test(request)) {
                    return callback(null, "BABYLON.GUIEditor");
                } else if (/^addons\//.test(request)) {
                    return callback(null, "ADDONS");
                }

                // Continue without externalizing the import
                callback();
            },
            // TODO add externals for production build vs. serve
            // React, react dom etc'
        ],
        module: {
            rules: webpackTools.getRules(),
        },
        plugins: [],
    };
    return commonConfig;
};
