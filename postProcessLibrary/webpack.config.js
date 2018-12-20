const path = require('path');
const webpack = require('webpack');
const babylonExternals = require('../Tools/WebpackPlugins/babylonExternals');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        'babylonjs-postProcessesLibrary': path.resolve(__dirname, './src/legacy/legacy.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release/postProcessLibrary'),
        filename: 'babylonjs.postProcess.min.js',
        libraryTarget: 'umd',
        library: {
            root: ["POSTPROCESSES"],
            amd: "babylonjs-postProcessesLibrary",
            commonjs: "babylonjs-postProcessesLibrary"
        },
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts']
    },
    externals: [babylonExternals()],
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