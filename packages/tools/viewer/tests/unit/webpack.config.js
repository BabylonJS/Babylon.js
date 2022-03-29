const path = require('path');

const ViewerResolve = require('../../../Tools/WebpackPlugins/viewerResolve');

module.exports = {
    context: __dirname,
    entry: {
        'test': __dirname + '/src/index.ts'
    },
    output: {
        libraryTarget: 'umd',
        library: 'BabylonViewer',
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            "babylonjs": __dirname + '/../../../dist/preview release/babylon.max.js',
            "babylonjs-materials": __dirname + '/../../../dist/preview release/materialsLibrary/babylonjs.materials.js',
            "babylonjs-loaders": __dirname + '/../../../dist/preview release/loaders/babylonjs.loaders.js',
            "babylonjs-viewer-assets": __dirname + '/../../src/assets/index.ts'
        },
        plugins: [
            new ViewerResolve(["babylonjs", "babylonjs-loaders"])
        ]
    },
    mode: "development",
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        },
        {
            test: /\.(html)$/,
            use: {
                loader: 'html-loader',
                options: {
                    minimize: true
                }
            }
        },
        {
            test: /\.(jpe?g|png|ttf|eot|svg?)(\?[a-z0-9=&.]+)?$/,
            use: 'base64-image-loader?limit=1000&name=[name].[ext]'
        },
        {
            test: /\.(woff|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'base64-inline-loader?limit=1000&name=[name].[ext]'
        }]
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: false,
        //open: true,
        port: 9000
    }
}