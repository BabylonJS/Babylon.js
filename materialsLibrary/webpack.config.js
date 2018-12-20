const path = require('path');
const webpack = require('webpack');
const babylonExternals = require('../Tools/WebpackPlugins/babylonExternals');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        'babylonjs-materials': path.resolve(__dirname, './src/legacy/legacy-grid.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release/materialsLibrary'),
        filename: 'babylonjs.materials.min.js',
        libraryTarget: 'umd',
        library: {
            root: ["MATERIALS"],
            amd: "babylonjs-materials",
            commonjs: "babylonjs-materials"
        },
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts']
    },
    externals: [babylonExternals()],
    devtool: "souce-map",
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
    ],
}