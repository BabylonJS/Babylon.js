const path = require('path');
const webpack = require('webpack');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        'babylonjs-procedural-textures': path.resolve(__dirname, './legacy/legacy.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release/gui'),
        filename: 'babylonjs.proceduralTextures.min.js',
        libraryTarget: 'umd',
        library: {
            root: ["PTLIB"],
            amd: "babylonjs-procedural-textures",
            commonjs: "babylonjs-procedural-textures"
        },
        umdNamedDefine: true,
        //devtoolModuleFilenameTemplate: "[absolute-resource-path]"
    },
    resolve: {
        extensions: [".js", '.ts']
    },
    externals: [
        {
            babylonjs: {
                root: "BABYLON",
                commonjs: "babylonjs",
                commonjs2: "babylonjs",
                amd: "babylonjs"
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
                configFileName: '../../proceduralTexturesLibrary/tsconfig.json',
                declaration: false
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
        new HardSourceWebpackPlugin(),
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