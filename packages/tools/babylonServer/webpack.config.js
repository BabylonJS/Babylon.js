const path = require("path");
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
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        mode: production ? "production" : "development",
        devtool: production ? "source-map" : "eval-cheap-module-source-map",
        entry: {
            sceneTs: "./src/sceneTs.ts",
            sceneJs: "./src/sceneJs.js",
            babylon: `./src/core/index-${source}.ts`,
            "gui/babylon.gui.min": `./src/gui/index-${source}.ts`,
            "inspector/babylon.inspector.min": `./src/inspector/index.ts`,
            "serializers/babylonjs.serializers.min": `./src/serializers/index-${source}.ts`,
            "loaders/babylonjs.loaders.min": `./src/loaders/index-${source}.ts`,
            "materialsLibrary/babylonjs.materials.min": `./src/materials/index-${source}.ts`,
            "postProcessesLibrary/babylonjs.postProcess.min": `./src/postProcesses/index-${source}.ts`,
            "proceduralTexturesLibrary/babylonjs.proceduralTextures.min": `./src/proceduralTextures/index-${source}.ts`,
            "nodeEditor/babylon.nodeEditor.min": `./src/nodeEditor/index.ts`,
            "guiEditor/babylon.guiEditor.min": `./src/guiEditor/index.ts`,
            "babylon.ktx2Decoder": `./src/ktx2Decoder/index.ts`,
            // "babylonjs-gltf2interface": `./src/babylon.glTF2Interface.d.ts`,
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js",
            devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
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
                "gui-editor": path.resolve(basePathForTools, "guiEditor", outputDirectoryForAliases),
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
        devServer: {
            static: ["public", "declarations", "../playground/public"],
            webSocketServer: production ? false : "ws",
            compress: production,
            port: env.cdnPort || env.CDN_PORT || 1337,
            server: env.enableHttps !== undefined || process.env.ENABLE_HTTPS === "true" ? "https" : "http",
            hot: (env.enableHotReload !== undefined || process.env.ENABLE_HOT_RELOAD === "true") && !production ? true : false,
            liveReload: (env.enableLiveReload !== undefined || process.env.ENABLE_LIVE_RELOAD === "true") && !production ? true : false,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            client: {
                overlay: {
                    warnings: false,
                    errors: true,
                },
                logging: production ? "error" : "info",
                progress: true,
            },
        },
        plugins: [],
    };
    // rewrites for back-compat
    const redirects = [
        {
            from: "/babylon.max.js",
            to: "/babylon.js",
        },
        {
            from: "/gui/babylon.gui.js",
            to: "/gui/babylon.gui.min.js",
        },
        {
            from: "/serializers/babylonjs.serializers.js",
            to: "/serializers/babylonjs.serializers.min.js",
        },
        {
            from: "/loaders/babylonjs.loaders.js",
            to: "/loaders/babylonjs.loaders.min.js",
        },
        {
            from: "/materialsLibrary/babylonjs.materials.js",
            to: "/materialsLibrary/babylonjs.materials.min.js",
        },
        {
            from: "/postProcessesLibrary/babylonjs.postProcess.js",
            to: "/postProcessesLibrary/babylonjs.postProcess.min.js",
        },
        {
            from: "/proceduralTexturesLibrary/babylonjs.proceduralTextures.js",
            to: "/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        },
        {
            from: "/babylon.d.ts",
            to: "/core.d.ts",
        },
        {
            from: "/gui/babylon.gui.d.ts",
            to: "/gui.d.ts",
        },
        {
            from: "/inspector/babylon.inspector.bundle.js",
            to: "/inspector/babylon.inspector.min.js",
        },
        {
            from: "/inspector/babylon.inspector.d.ts",
            to: "/inspector.d.ts",
        },
        {
            from: "/nodeEditor/babylon.nodeEditor.js",
            to: "/nodeEditor/babylon.nodeEditor.min.js",
        },
        {
            from: "/nodeEditor/babylon.nodeEditor.d.ts",
            to: "/node-editor.d.ts",
        },
        {
            from: "/guiEditor/babylon.guiEditor.js",
            to: "/guiEditor/babylon.guiEditor.min.js",
        },
        {
            from: "/guiEditor/babylon.guiEditor.d.ts",
            to: "/gui-editor.d.ts",
        },
        /*
            still missing
            "https://preview.babylonjs.com/glTF2Interface/babylon.glTF2Interface.d.ts",
            */
        {
            from: "/loaders/babylonjs.loaders.d.ts",
            to: "/loaders.d.ts",
        },
        {
            from: "/materialsLibrary/babylonjs.materials.d.ts",
            to: "/materials.d.ts",
        },
        {
            from: "/postProcessesLibrary/babylonjs.postProcess.d.ts",
            to: "/post-processes.d.ts",
        },
        {
            from: "/proceduralTexturesLibrary/babylonjs.proceduralTextures.d.ts",
            to: "/procedural-textures.d.ts",
        },
        {
            from: "/serializers/babylonjs.serializers.d.ts",
            to: "/serializers.d.ts",
        },
    ];
    commonConfig.devServer.historyApiFallback = {
        rewrites: redirects.map((data) => {
            return {
                from: new RegExp(data.from),
                to: data.to,
            };
        }),
    };

    return commonConfig;
};
