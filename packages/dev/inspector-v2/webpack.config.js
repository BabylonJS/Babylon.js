const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ReactRefreshTypeScript = require("react-refresh-typescript").default;

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
                static: ["test/app"],
                port: process.env.INSPECTOR_TEST_PORT || 9001,
            }
        ),

        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx", ".svg", ".scss"],
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
                            loader: "ts-loader",
                            options: {
                                configFile: "tsconfig.build.json",
                                getCustomTransformers: () => ({
                                    before: [ReactRefreshTypeScript()].filter(Boolean),
                                }),
                                transpileOnly: true,
                            },
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.(jpe?g|png|ttf|woff|eot|svg?)(\?[a-z0-9=&.]+)?$/,
                    type: "asset/inline",
                },
                {
                    test: /(?<!module)\.s[ac]ss$/i,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: true,
                                modules: false,
                            },
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                api: "modern",
                                sourceMap: true,
                            },
                        },
                    ],
                },
            ],
        },

        plugins: [new ReactRefreshWebpackPlugin()].filter(Boolean),
    };
};
