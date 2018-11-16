const path = require('path');
const webpack = require('webpack');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        'babylonjs-materials': path.resolve(__dirname, './src/legacy/legacy.ts'),
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
    externals: [
        {
            babylonjs: {
                root: "BABYLON",
                commonjs: "babylonjs",
                commonjs2: "babylonjs",
                amd: "babylonjs"
            }
        },
        /^babylonjs.*$/i,
    ],
    devtool: "souce-map",
    module: {
        rules: [{
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: [
            {
                loader: 'awesome-typescript-loader',
                options: {
                    configFileName: '../../materialsLibrary/tsconfig.json',
                    declaration: false
                }
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