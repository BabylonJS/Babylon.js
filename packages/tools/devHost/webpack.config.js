const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const outputDirectoryForAliases = "src";
const buildTools = require("@dev/build-tools");
const externalsFunction = buildTools.webpackTools.externalsFunction;
const rules = buildTools.webpackTools.getRules({
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

// option - min files or max files, but it is just the filenames. all will have sourcemaps

// option type of build served

/*

webpack --env=key=value

env: {
    mode: string,
    source: string,
    enableHttps: boolean,
    enableHotReload: boolean,
}
*/

module.exports = (env) => {
    const source = env.source || process.env.SOURCE || "dev"; // || "lts";
    const basePathForSources = path.resolve(__dirname, "../../", source);
    const basePathForTools = path.resolve(__dirname, "../../", "tools");
    const externals = externalsFunction();
    rules.shift();
    rules.push({
        test: /\.tsx?$/,
        oneOf: [
            {
                loader: "ts-loader",
                issuer: [path.resolve(basePathForSources, "loaders", outputDirectoryForAliases)],
                options: {
                    transpileOnly: false,
                    configFile: path.resolve(basePathForSources, "loaders", "./tsconfig.build.json"),
                },
            },
            {
                loader: "ts-loader",
                issuer: [path.resolve(basePathForSources, "serializers", outputDirectoryForAliases)],
                options: {
                    transpileOnly: false,
                    configFile: path.resolve(basePathForSources, "serializers", "./tsconfig.build.json"),
                },
            },
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
    const commonConfig = {
        ...buildTools.webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "main.js",
                dirName: __dirname,
            },
            {
                static: ["public"],
                port: process.env.TOOLS_PORT || 1338,
                showBuildProgress: true,
            }
        ),
        entry: {
            entry: "./src/index.ts",
        },
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
            alias: {
                core: path.resolve(basePathForSources, "core", outputDirectoryForAliases),
                gui: path.resolve(basePathForSources, "gui", outputDirectoryForAliases),
                serializers: path.resolve(basePathForSources, "serializers", outputDirectoryForAliases),
                loaders: path.resolve(basePathForSources, "loaders", outputDirectoryForAliases),
                materials: path.resolve(basePathForSources, "materials", outputDirectoryForAliases),
                inspector: path.resolve(__dirname, "../../", "dev", "inspector", outputDirectoryForAliases),
                "shared-ui-components": path.resolve(__dirname, "../../", "dev", "sharedUiComponents", outputDirectoryForAliases),
                "post-processes": path.resolve(basePathForSources, "postProcesses", outputDirectoryForAliases),
                "procedural-textures": path.resolve(basePathForSources, "proceduralTextures", outputDirectoryForAliases),
                "node-editor": path.resolve(basePathForTools, "nodeEditor", outputDirectoryForAliases),
                "node-geometry-editor": path.resolve(basePathForTools, "nodeGeometryEditor", outputDirectoryForAliases),
                "gui-editor": path.resolve(basePathForTools, "guiEditor", outputDirectoryForAliases),
                accessibility: path.resolve(basePathForTools, "accessibility", outputDirectoryForAliases),
            },
            symlinks: false,
            // modules: [path.resolve(__dirname, "../../dev/"), 'node_modules'],
        },
        externals: [
            function ({ context, request }, callback) {
                const cheapcb = (err, result) => {
                    callback(err, result && result.root);
                };
                const relative = path.relative(path.resolve("."), context);
                const child = relative && !relative.startsWith("..") && !path.isAbsolute(relative);
                if (child) {
                    callback();
                } else {
                    externals({ context, request }, cheapcb);
                }
            },
        ],
        optimization: {
            removeAvailableModules: false,
            removeEmptyChunks: false,
            splitChunks: false,
        },
        performance: {
            hints: false,
        },
        module: {
            rules,
        },
        plugins: env.analyze
            ? [
                  new BundleAnalyzerPlugin({
                      analyzerMode: "static",
                      generateStatsFile: true,
                      defaultSizes: "stat",
                  }),
              ]
            : [],
    };

    return commonConfig;
};

// module.exports = (env) => {
//     const source = env.source || process.env.SOURCE || "dev";
//     const commonConfig = {
//         entry: "./src/index.ts",
//         ...webpackTools.commonDevWebpackConfiguration(
//             {
//                 ...env,
//                 outputFilename: "main.js",
//                 dirName: __dirname,
//             },
//             {
//                 static: ["public"],
//                 port: process.env.TOOLS_PORT || 1338,
//             }
//         ),
//         resolve: {
//             extensions: [".ts", "*.tsx", ".js"],
//             alias: {
//                 core: `@${source}/core/dist`,
//                 loaders: `@${source}/loaders/dist`,
//                 gui: `@${source}/gui/dist`,
//                 serializers: `@${source}/serializers/dist`,
//                 inspector: `@dev/inspector/dist`,
//                 "shared-ui-components": `@dev/shared-ui-components/dist`,
//                 materials: `@${source}/materials/dist`,
//                 "post-processes": `@${source}/post-processes/dist`,
//                 "procedural-textures": `@${source}/procedural-textures/dist`,
//                 "gui-editor": `@tools/gui-editor/dist`,
//                 "node-editor": `@tools/node-editor/dist`,
//             },
//         },
//         experiments: {
//             outputModule: true,
//         },
//         module: {
//             rules: webpackTools.getRules(),
//         },
//         plugins: [
//             new HtmlWebpackPlugin({
//                 inject: true,
//                 template: path.resolve("./public/index.html"),
//                 scriptLoading: "module",
//             }),
//         ],
//     };
//     return commonConfig;
// };
