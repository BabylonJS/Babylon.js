const path = require("path");
const outputDirectoryForAliases = "dist";
const buildTools = require("@dev/build-tools");
const externalsFunction = buildTools.webpackTools.externalsFunction;

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
    const externals = externalsFunction();
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        mode: production ? "production" : "development",
        devtool: production ? "source-map" : "eval-cheap-module-source-map",
        entry: {
            sceneTs: "./src/sceneTs.ts",
            sceneJs: "./src/sceneJs.js",
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js",
            devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
        resolve: {
            extensions: [".js", ".ts"],
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
            },
            symlinks: false,
            // modules: [path.resolve(__dirname, "../../dev/"), 'node_modules'],
        },
        // externals: [
        //     function ({ context, request }, callback) {
        //         const cheapcb = (err, result) => {
        //             callback(err, result && result.root);
        //         };
        //         const relative = path.relative(path.resolve("."), context);
        //         const child = relative && !relative.startsWith("..") && !path.isAbsolute(relative);
        //         if (child) {
        //             callback();
        //         } else {
        //             externals({ context, request }, cheapcb);
        //         }
        //     },
        // ],
        // optimization: {
        //     removeAvailableModules: false,
        //     removeEmptyChunks: false,
        //     splitChunks: false,
        // },
        // performance: {
        //     hints: false,
        // },
        module: {
            rules: buildTools.webpackTools.getRules({
                includeAssets: true,
                includeCSS: true,
                sideEffects: true,
                tsOptions: {
                    transpileOnly: true,
                },
            }),
        },
    };

    return commonConfig;
};
