// const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

const outputDirectoryForAliases = "dist";
const basePathForDev = path.resolve(__dirname, "../../", "dev");
const basePathForTools = path.resolve(__dirname, "../../", "tools");

const rules = webpackTools.getRules({
    includeAssets: true,
    includeCSS: true,
    sideEffects: true,
    tsOptions: {
        transpileOnly: true,
        compilerOptions: {
            declaration: false,
        },
    },
});

rules.shift();
rules.push({
    test: /\.tsx?$/,
    oneOf: [
        {
            loader: "ts-loader",
            issuer: [path.resolve(basePathForDev, "loaders", outputDirectoryForAliases)],
            options: {
                transpileOnly: false,
                configFile: path.resolve(basePathForDev, "loaders", "./tsconfig.build.json"),
            },
        },
        // {
        //     loader: "ts-loader",
        //     issuer: [path.resolve(basePathForSources, "serializers", outputDirectoryForAliases)],
        //     options: {
        //         transpileOnly: false,
        //         configFile: path.resolve(basePathForSources, "serializers", "./tsconfig.build.json"),
        //     },
        // },
        {
            loader: "ts-loader",
            // issuer: { not: [/loaders/] },
            options: {
                transpileOnly: true,
                configFile: "tsconfig.build.json",
            },
        },
    ],
    exclude: /node_modules/,
    sideEffects: true,
});

module.exports = (env) => {
    const commonConfig = {
        entry: "./src/index.tsx",

        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "index.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.VIEWER_CONFIGURATOR_PORT || 3003,
            }
        ),

        resolve: {
            extensions: [".js", ".ts", ".tsx" /*, ".scss", "*.svg"*/],
            alias: {
                core: path.resolve(basePathForDev, "core", outputDirectoryForAliases),
                // viewer: path.resolve(basePathForTools, "viewer", outputDirectoryForAliases),
                loaders: path.resolve(basePathForDev, "loaders", outputDirectoryForAliases),
                "shared-ui-components": path.resolve(basePathForDev, "sharedUiComponents", outputDirectoryForAliases),
            },
            /**
             *  ERROR in ../viewer/src/viewer.ts 23:0-57
                Module not found: Error: Can't resolve 'loaders/dynamic' in '/Users/alexandracornidehuber/Repos/Babylon.js/packages/tools/viewer/src'
                Did you mean './loaders/dynamic'?
                Requests that should resolve in the current directory need to start with './'.
                Requests that start with a name are treated as module requests and resolve within module directories (node_modules).
                If changing the source code is not an option there is also a resolve options called 'preferRelative' which tries to resolve these kind of requests in the current directory too.
             */
            preferRelative: true,
            symlinks: false,
        },

        // externals: {
        //     // fs: true,
        //     // "@dev/core": "BABYLON",
        // },

        module: {
            rules,
        },

        optimization: {
            usedExports: true,
        },

        // plugins: [
        //     new MonacoWebpackPlugin({
        //         // publicPath: "public/",
        //         languages: ["typescript", "javascript"],
        //     }),
        // ],
    };
    return commonConfig;
};
