var webpack = require("webpack");

module.exports = {
    entry: "./index.js",
    output: {
        path: __dirname + '/dist',        
        filename: "inspector.js",
        libraryTarget: "umd",
        library: "INSPECTOR",
        umdNamedDefine: true
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ]
        
    },
    // plugins: [
    //     new webpack.optimize.UglifyJsPlugin({
    //         compress: {
    //             warnings: false
    //         },
    //         mangle:false
    //     })
    // ]
};