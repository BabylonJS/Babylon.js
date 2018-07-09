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
    plugins: [
        // fixing a small issue when root is an array and not a string
        /*new webpack.SourceMapDevToolPlugin({
            filename: '[name].js.map',
        })*/
    ],
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
    }
}
//]