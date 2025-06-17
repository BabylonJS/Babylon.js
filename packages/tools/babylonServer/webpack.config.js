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
    const commonConfig = {
        ...buildTools.webpackTools.commonDevWebpackConfiguration(
            {
                mode: env.mode,
                outputFilename: "[name].js",
                dirName: __dirname,
                enableHotReload: env.enableHotReload,
                enableHttps: env.enableHttps,
                enableLiveReload: env.enableLiveReload,
            },
            {
                port: env.cdnPort || env.CDN_PORT || 1337,
                static: ["public", "declarations", "../playground/public"],
                showBuildProcess: true,
            }
        ),
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
            "nodeGeometryEditor/babylon.nodeGeometryEditor.min": `./src/nodeGeometryEditor/index.ts`,
            "nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.min": `./src/nodeRenderGraphEditor/index.ts`,
            "nodeParticleEditor/babylon.nodeParticleEditor.min": `./src/nodeParticleEditor/index.ts`,
            "guiEditor/babylon.guiEditor.min": `./src/guiEditor/index.ts`,
            "addons/babylonjs.addons.min": `./src/addons/index.ts`,
            "accessibility/babylon.accessibility.min": `./src/accessibility/index.ts`,
            "babylon.ktx2Decoder": `./src/ktx2Decoder/index.ts`,
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
                "node-render-graph-editor": path.resolve(basePathForTools, "nodeRenderGraphEditor", outputDirectoryForAliases),
                "node-particle-editor": path.resolve(basePathForTools, "nodeParticleEditor", outputDirectoryForAliases),
                "gui-editor": path.resolve(basePathForTools, "guiEditor", outputDirectoryForAliases),
                accessibility: path.resolve(basePathForTools, "accessibility", outputDirectoryForAliases),
                addons: path.resolve(basePathForSources, "addons", outputDirectoryForAliases),
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
            from: "/addons/babylonjs.addons.js",
            to: "/addons/babylonjs.addons.min.js",
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
            from: "/nodeGeometryEditor/babylon.nodeGeometryEditor.js",
            to: "/nodeGeometryEditor/babylon.nodeGeometryEditor.min.js",
        },
        {
            from: "/nodeGeometryEditor/babylon.nodeGeometryEditor.d.ts",
            to: "/node-geometry-editor.d.ts",
        },
        {
            from: "/nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.js",
            to: "/nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.min.js",
        },
        {
            from: "/nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.d.ts",
            to: "/node-render-graph-editor.d.ts",
        },
        {
            from: "/nodeParticleEditor/babylon.nodeParticleEditor.d.ts",
            to: "/node-particle-editor.d.ts",
        },
        {
            from: "/guiEditor/babylon.guiEditor.js",
            to: "/guiEditor/babylon.guiEditor.min.js",
        },
        {
            from: "/guiEditor/babylon.guiEditor.d.ts",
            to: "/gui-editor.d.ts",
        },
        {
            from: "/accessibility/babylon.accessibility.js",
            to: "/accessibility/babylon.accessibility.min.js",
        },
        {
            from: "/accessibility/babylon.accessibility.d.ts",
            to: "/accessibility.d.ts",
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
        {
            from: "/addons/babylonjs.addons.d.ts",
            to: "/addons.d.ts",
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
