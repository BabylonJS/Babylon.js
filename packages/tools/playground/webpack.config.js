const path = require("path");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        mode: production ? "production" : "development",
        entry: "./src/legacy/legacy.ts",
        devtool: production ? "source-map" : "eval-cheap-module-source-map",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "babylon.playground.js",
            devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
        },
        externals: {
            "@dev/core": "BABYLON",
        },
        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: true,
                extraRules: [
                    {
                        test: /\.ttf$/,
                        type: "asset/resource",
                    },
                    {
                        test: /\.svg$/,
                        use: ["@svgr/webpack"],
                    },
                ],
            }),
            // [
            //     {
            //         test: /\.tsx?$/,
            //         loader: "ts-loader",
            //         exclude: /node_modules/,
            //         sideEffects: true,
            //         options: {
            //             configFile: "tsconfig.build.json",
            //         },
            //     },
            //     {
            //         sideEffects: true,
            //         test: /\.js$/,
            //         enforce: "pre",
            //         use: ["source-map-loader"],
            //     },
            //     {
            //         test: /\.scss$/,
            //         use: [
            //             // Fallback to style-loader in development
            //             process.env.NODE_ENV !== "production" ? "style-loader" : MiniCssExtractPlugin.loader,
            //             "css-loader",
            //             "sass-loader",
            //         ],
            //     },
            //     {
            //         test: /\.css$/,
            //         use: ["style-loader", "css-loader"],
            //     },
            //     {
            //         test: /\.svg$/,
            //         use: ["@svgr/webpack"],
            //     },
            //     {
            //         test: /\.ttf$/,
            //         type: "asset/resource",
            //     },
            // ],
        },
        devServer: {
            static: {
                directory: path.join(__dirname, "public"),
                watch: false,
            },
            // hot: true,
            port: process.env.PLAYGROUND_PORT || 1338,
            server: env.enableHttps !== undefined || process.env.ENABLE_HTTPS === "true" ? "https" : "http",
            hot: (env.enableHotReload !== undefined || process.env.ENABLE_HOT_RELOAD === "true") && !production ? true : false,
            liveReload: (env.enableLiveReload !== undefined || process.env.ENABLE_LIVE_RELOAD === "true") && !production ? true : false,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        },
        plugins: [
            // new HtmlWebpackPlugin({
            //     inject: true,
            //     template: path.resolve(__dirname, "public/index.html"),
            // }),
            // new HtmlWebpackPlugin({
            //     inject: true,
            //     filename: "frame.html",
            //     template: path.resolve(__dirname, "public/frame.html"),
            // }),
            // new HtmlWebpackPlugin({
            //     inject: true,
            //     filename: "landmarkeditor.html",
            //     template: path.resolve(__dirname, "public/landmarkeditor.html"),
            // }),
            // new CopyPlugin({
            //     patterns: [
            //         {
            //             from: "**/*.!(html)",
            //             to() {
            //                 return "[path]/[name][ext]";
            //             },
            //             context: "public/",
            //         },
            //     ],
            // }),
            // new MiniCssExtractPlugin({
            //     // Options similar to the same options in webpackOptions.output
            //     // Both options are optional
            //     filename: "[name].css",
            //     chunkFilename: "[id].css",
            // }),
            new MonacoWebpackPlugin({
                // publicPath: "public/",
                languages: ["typescript", "javascript"],
            }),
        ],
    };
    return commonConfig;
};
