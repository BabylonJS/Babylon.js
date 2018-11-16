const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    context: __dirname,
    entry: {
        'babylonjs-gui': path.resolve(__dirname, './legacy/legacy.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release/gui'),
        filename: 'babylon.gui.min.js',
        libraryTarget: 'umd',
        library: {
            root: ["BABYLON", "GUI"],
            amd: "babylonjs-gui",
            commonjs: "babylonjs-gui"
        },
        umdNamedDefine: true
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
                configFileName: '../../gui/tsconfig.json',
                declarationDir: '../../dist/preview release/gui/build'
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
        new CleanWebpackPlugin([
            path.resolve(__dirname, './src/**/*.js'),
            path.resolve(__dirname, './src/**/*.map')
        ]),
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