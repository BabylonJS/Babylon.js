const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const babylonWebpackConfig = require('../Tools/WebpackPlugins/babylonWebpackConfig');

var config = babylonWebpackConfig({
    module: "sandbox",
    entry: "./legacy/legacy.ts",
    output: {
        globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
        filename: "babylon.sandbox.js",
        path: path.resolve(__dirname, "public/dist"),
        publicPath: "./dist/",
        libraryTarget: 'umd',
        library: {
           root: ["SANDBOX"],
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
            use: [
              {
                loader: 'svg-url-loader',
                options: {
                  limit: 10000,
                },
              },
            ],
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
