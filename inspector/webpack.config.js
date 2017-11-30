module.exports = {
    entry: [
        "../../dist/preview release/inspector/babylon.inspector.css",
        "../../dist/preview release/inspector/babylon.inspector.min.js"
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
        loaders: [
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            //    { test: /babylon.inspector.min.js$/, loader: "imports?Split=split!exports-loader?INSPECTOR" }
        ]
    }
}