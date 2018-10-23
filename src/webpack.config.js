const path = require('path');
const webpack = require('webpack');
const DtsBundleWebpack = require('dts-bundle-webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

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
        umdNamedDefine: true,
        //devtoolModuleFilenameTemplate: "[absolute-resource-path]"
    },
    resolve: {
        extensions: [".js", '.ts']
    },
    externals: {
        babylonjs: {
            root: "BABYLON",
            commonjs: "babylonjs",
            commonjs2: "babylonjs",
            amd: "babylonjs"
        }
    },
    devtool: "source-map",
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader',
            options: {
                configFileName: '../../src/tsconfig.json',
                declarationDir: '../../dist/preview release/build'
            }
        }]
    },
    mode: "production",
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: false,
        //open: true,
        port: 9000
    },
    plugins: [
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/,
            /\.fx$/
        ])
    ],
    watchOptions: {
        ignored: [path.resolve(__dirname, './dist/**/*.*'), 'node_modules']
    }
}