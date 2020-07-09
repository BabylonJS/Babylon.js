const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const babylonWebpackConfig = require('../Tools/WebpackPlugins/babylonWebpackConfig');

var config = babylonWebpackConfig({
    module: "playground",
    entry: {
        "babylon.playground": "./index.ts",
        "editor.worker": "monaco-editor/esm/vs/editor/editor.worker.js",
        "ts.worker": "monaco-editor/esm/vs/language/typescript/ts.worker"
    },
    output: {
        globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "public/dist"),
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
        }, {
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
        })
    ]
});

module.exports = config;
