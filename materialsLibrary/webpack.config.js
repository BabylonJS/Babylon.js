const path = require('path');
const webpack = require('webpack');
const DtsBundleWebpack = require('dts-bundle-webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    context: __dirname,
    entry: {
        'babylonjs-materials': path.resolve(__dirname, './src/legacy.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release/materialsLibrary'),
        filename: 'babylonjs.materials.min.js',
        libraryTarget: 'umd',
        library: {
            root: ["MATLIB"],
            amd: "babylonjs-materials",
            commonjs: "babylonjs-materials"
        },
        umdNamedDefine: true
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
            exclude: /node_modules/,
            use: [
            {
                // loader: 'ts-loader',
                // options: {
                //     onlyCompileBundledFiles: true,
                //     experimentalFileCaching: true
                // }
                loader: 'awesome-typescript-loader',
                options: {
                    configFileName: '../../materialsLibrary/tsconfig.json'
                }
            }]
        },
        {
            test: /\.fx$/,
            use: [{
                loader: path.resolve(__dirname, '../Tools/WebpackShaderLoader/index.js')
            }]
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
        new CleanWebpackPlugin([
            path.resolve(__dirname, './src/**/*.js'),
            path.resolve(__dirname, './src/**/*.map')
        ]),
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/
        ])
    ],
    watchOptions: {
        ignored: [path.resolve(__dirname, './dist/**/*.*'), 'node_modules']
    }
}