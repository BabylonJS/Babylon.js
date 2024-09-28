const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const commonConfig = {
        entry: {
            [env.entry]: "./src/" + env.entry + ".ts",
            // engineOnly: "./src/engineOnly.ts",
            // minGridMaterial: "./src/minGridMaterial.ts",
            // minStandardMaterial: "./src/minStandardMaterial.ts",
            // sceneOnly: "./src/sceneOnly.ts",
            // thinEngineOnly: "./src/thinEngineOnly.ts",
            // sceneWithInspector: "./src/sceneWithInspector.ts",
        },
        ...webpackTools.commonDevWebpackConfiguration({
            mode: "production",
            outputFilename: "[name].js",
            dirName: __dirname,
            dirSuffix: env.entry,
        }),
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
        },
        module: {
            rules: webpackTools.getRules(),
        },
        plugins: [],
        optimization: {
            splitChunks: {
                cacheGroups: {
                    main: {
                        name: "main",
                        chunks: "initial",
                        priority: 1,
                    },
                    async: {
                        name: "async",
                        chunks: "async",
                    },
                },
            },
        },
    };
    return commonConfig;
};
