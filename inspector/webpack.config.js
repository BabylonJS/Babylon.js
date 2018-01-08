module.exports = {
    entry: [
        "../../dist/preview release/inspector/babylon.inspector.css",
        "../../dist/preview release/inspector/babylon.inspector.js"
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
            {
                test: /babylon.inspector.js/, use: [
                    "imports-loader?Split=split", "exports-loader?INSPECTOR"]

            }
        ]
    }
}