const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

var SRC_DIR = path.resolve(__dirname, "./src");
var DIST_DIR = path.resolve(__dirname, "./www");
var DEV_DIR = path.resolve(__dirname, "./.temp");

var buildConfig = function (env) {
    var isProd = env.prod;
    return {
        context: __dirname,
        entry: {
            index: SRC_DIR + "/app.ts",
        },
        performance: {
            maxEntrypointSize: 5120000,
            maxAssetSize: 5120000,
        },
        output: {
            path: isProd ? DIST_DIR : DEV_DIR,
            publicPath: "/",
            filename: "scripts/[name].[contenthash].js",
            library: "scripts/[name]",
            libraryTarget: "umd",
            devtoolModuleFilenameTemplate: isProd ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
        devtool: isProd ? false : "eval-cheap-module-source-map",
        devServer: {
            static: ["www"],
            port: 8080,
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./index.html",
                filename: "index.html",
            }),
        ],
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".scss", ".svg"],
            alias: {
                react: path.resolve("../../node_modules/react"),
                "react-dom": path.resolve("../../node_modules/react-dom"),
            },
        },
        module: {
            rules: [
                {
                    test: /\.(png|svg|jpg|jpeg|gif|ttf)$/i,
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
                                modules: "global",
                                esModule: true,
                            },
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: true,
                                api: "modern",
                            },
                        },
                    ],
                },
                {
                    test: /\.module\.s[ac]ss$/i,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: true,
                                modules: true,
                                esModule: true,
                            },
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: true,
                                api: "modern",
                            },
                        },
                    ],
                },
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                },
                {
                    test: /\.js$/,
                    enforce: "pre",
                    use: ["source-map-loader"],
                },
            ],
        },
        mode: isProd ? "production" : "development",
    };
};

module.exports = buildConfig;
