const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageAliasPath: `../../../dev/inspector-v2/dist`,
        devPackageName: "inspector",
        overrideFilename: "babylon.inspector-v2",
        namespace: "INSPECTOR",
        outputPath: path.resolve(__dirname),
        maxMode: true,
        minToMax: true,
        alias: {
            "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
        },
    });
    return commonConfig;
};
