const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        'viewer': './src/index.ts',
        //'viewer.min': './src/index.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'Viewer3D',
        umdNamedDefine: true,
        devtoolModuleFilenameTemplate: '[absolute-resource-path]'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devtool: 'source-map',
    plugins: [
        new webpack.WatchIgnorePlugin([
            /\.d\.ts$/
        ]),
        /*new UglifyJSPlugin({

            uglifyOptions: {
                compress: {
                    warnings: false,
                },
                output: {
                    comments: false
                }
            },
            sourceMap: true,
            include: /\.min/,
        })*/
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
                loader: 'html-loader'
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