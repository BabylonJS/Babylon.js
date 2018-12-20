const path = require('path');
const webpack = require('webpack');
const babylonExternals = require('./babylonExternals');
const hardSourceWebpackPlugin = require('hard-source-webpack-plugin');

var configPath = "../Gulp/config.json";
const configFolder = path.dirname(path.resolve(__dirname, configPath));
const config = require(configPath);

module.exports = function defaultConfig(options) {
    if (!options) {
        throw "Options are mandatory to create the config.";
    }

    const module = options.module;
    const settings = config[module];

    const src = path.resolve(__dirname, settings.build.srcDirectory);
    const configPath = path.join(settings.build.mainFolder, "webpack.config.js");
    const webpackFolder = path.dirname(path.resolve(configFolder, configPath));

    options.resolveExtensions = options.resolveExtensions || [];
    options.moduleRules = options.moduleRules || [];
    options.plugins = options.plugins || [];

    return {
        context: src,
        entry: {
            [settings.build.processDeclaration.packageName]: path.resolve(src, settings.libraries[0].entry),
        },
        output: {
            path: path.resolve(__dirname, config.build.outputDirectory) + settings.build.distOutputDirectory,
            filename: settings.libraries[0].output,
            libraryTarget: 'umd',
            library: {
                root: settings.build.processDeclaration.moduleName.split("."),
                amd: settings.build.processDeclaration.packageName,
                commonjs: settings.build.processDeclaration.packageName
            },
            umdNamedDefine: true
        },
        resolve: options.resolve || {
            extensions: [".ts", ...options.resolveExtensions]
        },
        externals: [babylonExternals()],
        devtool: "none",
        module: {
            rules: [{
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                options: {
                    configFileName: path.resolve(webpackFolder, './tsconfig.json'),
                    declaration: false
                }
            }, ...options.moduleRules]
        },
        mode: "production",
        performance: {
            hints: false
        },
        plugins: [
            new hardSourceWebpackPlugin(),
            new webpack.WatchIgnorePlugin([
                /\.js$/,
                /\.d\.ts$/,
                /\.fx$/
            ]),
            ...options.plugins
        ]
    }
};