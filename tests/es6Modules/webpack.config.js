const path = require("path");
const config = require("../../Tools/Config/config");

module.exports = {
    context: path.resolve(__dirname),
    entry: {
        thinEngineOnly: path.resolve(__dirname, 'thinEngineOnly.ts'),
        engineOnly: path.resolve(__dirname, 'engineOnly.ts'),
        sceneOnly: path.resolve(__dirname, 'sceneOnly.ts'),
        minGridMaterial: path.resolve(__dirname, 'minGridMaterial.ts'),
        minStandardMaterial: path.resolve(__dirname, 'minStandardMaterial.ts')
    },
    output: {
        filename: '[name].js',
        path: config.computed.tempFolder + '/testsES6Modules'
    },
    devtool: 'none',
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader'
        }]
    },
    mode: "production"
};