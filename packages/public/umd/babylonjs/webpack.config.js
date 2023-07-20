const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;
const commonConfigGenerator = webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "core",
        namespace: "BABYLON",
        outputPath: path.resolve(__dirname),
        maxMode: true,
        alias: {
            core: path.resolve(__dirname, "../../../dev/core/src"),
            "@lts/core": path.resolve(__dirname, "../../../lts/core/src"),
        },
    });
    return commonConfig;
};
