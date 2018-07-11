const path = require('path');
const webpack = require('webpack');
const DtsBundleWebpack = require('dts-bundle-webpack')

module.exports = {
    entry: {
        'babylonjs-gui': './src/index.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: {
            root: ["BABYLON", "GUI"],
            amd: "babylonjs-gui",
            commonjs: "babylonjs-gui"
        },
        umdNamedDefine: true,
        //devtoolModuleFilenameTemplate: '[relative-resource-path]'
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
            loader: "ts-loader",
            exclude: /node_modules/
        },
        {
            test: /\.fx$/,
            use: [{
                loader: path.resolve('../Tools/WebpackShaderLoader/index.js')
            }]
        }]
    },
    mode: "development",
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: false,
        //open: true,
        port: 9000
    },
    plugins: [
        new DtsBundleWebpack({
            name: "babylonjs-gui",
            main: path.resolve(__dirname, './dist/build/index.d.ts'),
            out: path.resolve(__dirname, './dist/index.d.ts'),
            baseDir: path.resolve(__dirname, './dist/build/'),
            headerText: "BabylonJS GUI"
        })
    ]
}
//]