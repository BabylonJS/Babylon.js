const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        'babylonjs-gui': './src/index.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'BABYLON.GUI',
        umdNamedDefine: true,
        devtoolModuleFilenameTemplate: '[relative-resource-path]'
    },
    resolve: {
        extensions: [".js", '.ts'],
        /*alias: {
            "babylonjs": __dirname + '/../dist/preview release/babylon.max.js'
        }*/
    },
    externals: {
        babylonjs: true
    },
    devtool: 'source-map',
    plugins: [
        new webpack.WatchIgnorePlugin([
            /\.d\.ts$/
        ])
    ],
    module: {
        rules: [{ test: /\.tsx?$/, loader: "ts-loader", exclude: /node_modules/ }]
    },
    mode: "development",
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: false,
        //open: true,
        port: 9000
    }
}
//]