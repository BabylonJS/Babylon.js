const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    return {
        mode: "production",
        entry: "../../../dev/inspector-v2/src/index.ts",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "index.js",
            library: {
                type: "module",
            },
            environment: {
                module: true,
            },
            clean: true,
        },
        experiments: {
            outputModule: true,
        },
        target: "es2020",
        // externals: {
        //     "/^addons\/.*$/": "addons/[request]",
        //     "/^core\/.*$/": "core/[request]",
        //     "/^gui\/.*$/": "gui/[request]",
        //     "/^loaders\/.*$/": "loaders/[request]",
        //     "/^materials\/.*$/": "materials/[request]",
        //     "/^serializers\/.*$/": "serializers/[request]",
        //     "/^@fluentui\/.*$/": "@fluentui/[request]",
        //     react: "react",
        //     "react-dom": "react-dom",
        //     "usehooks-ts": "usehooks-ts",
        // },
        externals: [
            webpackTools.externalsFunction(["inspector-v2"], "es6"),
            function ({ context, request }, callback) {
                // Check for @babylonjs packages (transformed by TypeScript) - these should be external
                if (/^@babylonjs\//.test(request)) {
                    return callback(null, request);
                }

                // Check for Fluent UI packages (including @fluentui-contrib)
                if (/^@fluentui(-contrib)?\//.test(request)) {
                    return callback(null, request);
                }

                // Check for other external packages
                if (request === "react" || request === "react-dom" || request === "usehooks-ts") {
                    return callback(null, request);
                }

                // Not external
                callback();
            },
        ],
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            alias: {
                addons: path.resolve("../../../dev/addons/dist"),
                core: path.resolve("../../../dev/core/dist"),
                gui: path.resolve("../../../dev/gui/dist"),
                loaders: path.resolve("../../../dev/loaders/dist"),
                materials: path.resolve("../../../dev/materials/dist"),
                serializers: path.resolve("../../../dev/serializers/dist"),
                "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/src"),
                "inspector-v2": path.resolve("../../../dev/inspector-v2/src"),
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    exclude: /node_modules/,
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.build.lib.json"),
                    },
                },
            ],
        },
        optimization: {
            minimize: false,
        },
    };
};
