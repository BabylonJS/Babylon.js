const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const babylonWebpackConfig = require('../Tools/WebpackPlugins/babylonWebpackConfig');

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

var config = babylonWebpackConfig({
    module: "playground",
    entry: "./legacy/legacy.ts",
    output: {
        globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
        filename: "babylon.playground.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/dist/",
        libraryTarget: 'umd',
        library: {
           root: ["PLAYGROUND"],
        },
        umdNamedDefine: true
    },
    resolve: {
        extensions: [".js", '.ts', ".tsx"],
    },
    moduleRules: [
        {
            test: /\.scss$/,
            use: [
                // fallback to style-loader in development
                process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
                "css-loader",
                "sass-loader"
            ]
        }, 
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.svg$/,
            use: ['@svgr/webpack']
        }, 
        {
            test: /\.ttf$/,
            use: ['file-loader']
        }
    ],
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new MonacoWebpackPlugin({
            publicPath: "dist/",
            languages: [ 
                "typescript",
                "javascript"
            ]
        })
    ]
});

module.exports = config;
