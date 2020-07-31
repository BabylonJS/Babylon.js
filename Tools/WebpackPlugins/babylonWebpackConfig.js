const webpack = require('webpack');
const babylonExternals = require('./babylonExternals');

const config = require("../Config/config.js");

module.exports = function defaultConfig(options) {
    if (!options) {
        throw "Options are mandatory to create the config.";
    }

    const module = options.module;
    const settings = config[module];

    options.resolveExtensions = options.resolveExtensions || [];
    options.moduleRules = options.moduleRules || [];
    options.plugins = options.plugins || [];

    options.entry = options.entry || {
        [settings.build.umd.packageName]: settings.libraries[0].computed.entryPath
    };

    options.output = options.output || {
        path: settings.computed.distDirectory,
        filename: settings.libraries[0].output
            .replace(".min.", ".")
            .replace(".max.", "."),
        libraryTarget: 'umd',
        library: {
            root: settings.build.umd.webpackRoot.split("."),
            amd: settings.build.umd.packageName,
            commonjs: settings.build.umd.packageName
        },
        umdNamedDefine: true,
        globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)'
    };

    return {
        context: settings.computed.srcDirectory,
        entry: options.entry,
        output: options.output,
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
                    configFileName: settings.computed.tsConfigPath,
                    declaration: false
                }
            }, ...options.moduleRules]
        },
        mode: "production",
        performance: {
            hints: false
        },
        plugins: [
            new webpack.WatchIgnorePlugin([
                /\.js$/,
                /\.d\.ts$/,
                /\.fx$/
            ]),
            ...options.plugins
        ]
    }
};