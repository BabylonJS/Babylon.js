const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        mode: production ? "production" : "development",
        entry: {
            engineOnly: "./src/engineOnly.ts",
            minGridMaterial: "./src/minGridMaterial.ts",
            minStandardMaterial: "./src/minStandardMaterial.ts",
            sceneOnly: "./src/sceneOnly.ts",
            thinEngineOnly: "./src/thinEngineOnly.ts",
            sceneWithInspector: "./src/sceneWithInspector.ts",
        },
        devtool: production ? false : "eval-cheap-module-source-map",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js",
            devtoolModuleFilenameTemplate: production ? undefined : "file:///[absolute-resource-path]",
        },
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
