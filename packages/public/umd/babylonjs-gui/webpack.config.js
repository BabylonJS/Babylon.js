const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "gui",
        namespace: "BABYLON.GUI",
        outputPath: path.resolve(__dirname),
        alias: {
            gui: path.resolve(__dirname, "../../../dev/gui/dist"),
            "@lts/gui": path.resolve(__dirname, "../../../lts/gui/dist"),
        },
    });
    return commonConfig;
};
