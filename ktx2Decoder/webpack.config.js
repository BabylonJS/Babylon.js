const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const babylonWebpackConfig = require('../Tools/WebpackPlugins/babylonWebpackConfig');

var config = babylonWebpackConfig({
    module: "ktx2Decoder",
    entry: "./legacy/legacy.ts",
    output: {
        globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
        filename: "babylon.ktx2Decoder.js",
        path: path.resolve(__dirname, "../dist/preview release"),
        publicPath: "/dist/",
        libraryTarget: 'umd',
        library: {
           root: ["KTX2DECODER"],
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
