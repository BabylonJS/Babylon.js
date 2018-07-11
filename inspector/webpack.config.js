const path = require('path');

module.exports = {
    //context: __dirname,
    entry: [
        path.resolve(__dirname, "../dist/preview release/inspector/babylon.inspector.css"),
        path.resolve(__dirname, "../dist/preview release/inspector/babylon.inspector.js")
    ],
    output: {
        libraryTarget: "var",
        library: "INSPECTOR",
        umdNamedDefine: true
    },
    resolve: {
        alias: {
            split: '../split.js'
        }
    },
    module: {
        rules: [
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            {
                test: /babylon.inspector.js/, use: [
                    "imports-loader?Split=split", "exports-loader?INSPECTOR"]

            }
        ]
    }
}