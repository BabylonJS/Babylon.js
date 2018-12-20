const path = require('path');
const webpack = require('webpack');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
    context: __dirname,
    entry: {
        'babylonjs': path.resolve(__dirname, './Legacy/legacy.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release'),
        filename: 'babylon.js',
        libraryTarget: 'umd',
        library: {
            root: ["BABYLON"],
            amd: "babylonjs",
            commonjs: "babylonjs"
        },
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts']
    },
    devtool: "source-map",
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader',
            options: {
                configFileName: path.resolve(__dirname, './tsconfig.json'),
                declaration: false
            }
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
            /\.d\.ts$/,
            /\.fx$/
        ])
    ]
}