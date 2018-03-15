const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        'viewer': './src/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'BabylonViewer',
        umdNamedDefine: true,
        devtoolModuleFilenameTemplate: '[absolute-resource-path]'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            "babylonjs": __dirname + '/../dist/preview release/babylon.max.js',
            "babylonjs-materials": __dirname + '/../dist/preview release/materialsLibrary/babylonjs.materials.js',
            "babylonjs-loaders": __dirname + '/../dist/preview release/loaders/babylonjs.loaders.js',
            "deepmerge": __dirname + '/assets/deepmerge.min.js'
        }
    },
    externals: {
        // until physics will be integrated in the viewer, ignore cannon
        cannon: 'CANNON',
        oimo: 'OIMO',
        './Oimo': 'OIMO'
    },
    devtool: 'source-map',
    plugins: [
        new webpack.WatchIgnorePlugin([
            /\.d\.ts$/
        ])
    ],
    module: {
        loaders: [{
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
            test: /\.(jpe?g|png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
            use: 'base64-image-loader?limit=1000&name=[name].[ext]'
        }]
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        //open: true,
        port: 9000
    }
}