const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = (env) => {
    return {
        entry: "./test/app/index.ts",

        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "bundle.js",
                dirName: __dirname,
                enableHotReload: true,
            },
            {
                static: ["public"],
                port: process.env.INSPECTOR_TEST_PORT || 9001,
            }
        ),

        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            alias: {
                core: path.resolve("../../dev/core/dist"),
                loaders: path.resolve("../../dev/loaders/dist"),
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            },
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                targets: "defaults",
                                presets: [["@babel/preset-env"], ["@babel/preset-react", { runtime: "automatic" }], ["@babel/preset-typescript"]],
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
            ],
        },

        plugins: [new ReactRefreshWebpackPlugin()].filter(Boolean),
    };
};
