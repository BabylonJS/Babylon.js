const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        'babylonjs-inspector': path.resolve(__dirname, './src/legacy/legacy.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release/inspector'),
        filename: 'babylon.inspector.bundle.js',
        libraryTarget: 'umd',
        library: {
            root: "INSPECTOR",
            amd: "babylonjs-inspector",
            commonjs: "babylonjs-inspector"
        },
        umdNamedDefine: true
    },
    resolve: {
        extensions: [".js", '.ts', ".tsx"],
    },
    externals: [
            {
            babylonjs: {
                root: "BABYLON",
                commonjs: "babylonjs",
                commonjs2: "babylonjs",
                amd: "babylonjs"
            },
            "babylonjs-gui": {
                root: ["BABYLON", "GUI"],
                commonjs: "babylonjs-gui",
                commonjs2: "babylonjs-gui",
                amd: "babylonjs-gui"
            },
            "babylonjs-loaders": {
                root: "BABYLON",
                commonjs: "babylonjs-loaders",
                commonjs2: "babylonjs-loaders",
                amd: "babylonjs-loaders"
            },
            "babylonjs-serializers": {
                root: "BABYLON",
                commonjs: "babylonjs-serializers",
                commonjs2: "babylonjs-serializers",
                amd: "babylonjs-serializers"
            }
        },
        /^babylonjs.*$/i
    ],
    devtool: "source-map",
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader',
            options: {
                configFileName: '../../inspector/tsconfig.json',
                declaration: false
            }
        },
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
        }]
    },
    mode: "production",
    performance: {
        hints: false
    },
    plugins: [
        new HardSourceWebpackPlugin(),
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/
        ]),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ]
}
