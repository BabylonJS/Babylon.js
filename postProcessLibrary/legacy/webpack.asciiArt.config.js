const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: __dirname,
    entry: {
        'babylonjs-postProcessesLibrary': path.resolve(__dirname, './legacy-asciiArt.ts'),
    },
    output: {
        path: path.resolve(__dirname, '../dist/preview release/postProcessesLibrary'),
        filename: 'babylon.asciiArtPostProcess.min.js',
        libraryTarget: 'umd',
        library: {
            root: ["POSTPROCESSLIBRARY"],
            amd: "babylonjs-postProcessesLibrary",
            commonjs: "babylonjs-postProcessesLibrary"
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
            loader: "ts-loader",
            exclude: /node_modules/
        },
        {
            test: /\.fx$/,
            use: [{
                loader: path.resolve(__dirname, '../../Tools/WebpackShaderLoader/index.js')
            }]
        }]
    },
    mode: "production",
    plugins: [
        new webpack.WatchIgnorePlugin([
            /\.js$/,
            /\.d\.ts$/
        ])
    ]
}