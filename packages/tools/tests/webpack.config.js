const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const commonConfig = {
        entry: {
            engineOnly: "./src/engineOnly.ts",
            minGridMaterial: "./src/minGridMaterial.ts",
            minStandardMaterial: "./src/minStandardMaterial.ts",
            sceneOnly: "./src/sceneOnly.ts",
            thinEngineOnly: "./src/thinEngineOnly.ts",
            sceneWithInspector: "./src/sceneWithInspector.ts",
        },
        ...webpackTools.commonDevWebpackConfiguration({
            mode: env.mode,
            outputFilename: "[name].js",
            dirName: __dirname,
        }),
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
        },
        module: {
            rules: webpackTools.getRules(),
        },
        plugins: [],
    };
    return commonConfig;
};
