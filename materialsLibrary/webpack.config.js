const path = require('path');
const webpack = require('webpack');
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
    externals: [
        function(_, request, callback) {
            if (/^babylonjs.*$/i.test(request)) {
                callback(null, {
                    root: "BABYLON",
                    commonjs: "babylonjs",
                    commonjs2: "babylonjs",
                    amd: "babylonjs"
                });
            }
            else {
                callback();
            }
        },
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
                    configFileName: path.resolve(__dirname, './tsconfig.json'),
                    declaration: false
                }
            }]
        }]
    },
    mode: "production",
    plugins: [
        new HardSourceWebpackPlugin(),
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/,
            /\.fx$/
        ])
    ],
}