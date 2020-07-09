const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const babylonWebpackConfig = require('../Tools/WebpackPlugins/babylonWebpackConfig');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

var config = babylonWebpackConfig({
    module: "playground",
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
            languages: ["typescript", "javascript"],
            publicPath: "/dist/preview release/Playground"
		})
    ]
});

module.exports = config;
