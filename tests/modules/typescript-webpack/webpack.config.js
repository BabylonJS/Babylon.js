const path = require("path");

module.exports = {
    entry: __dirname + '/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            "babylonjs": __dirname + '/../../../dist/preview release/babylon.max.js',
            "babylonjs-gui": __dirname + '/../../../dist/preview release/gui/babylon.gui.js',
            "babylonjs-loaders": __dirname + '/../../../dist/preview release/loaders/babylonjs.loaders.js',
            "babylonjs-serializers": __dirname + '/../../../dist/preview release/serializers/babylonjs.serializers.js',
        }
    },
    devtool: "source-map",
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
        ]
    },
    mode: "development"
};