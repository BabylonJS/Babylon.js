const path = require("path");
const { commonUMDWebpackConfiguration: commonConfigGenerator, externalsFunction } = require("@dev/build-tools").webpackTools;

const inspectorDefaultExternals = externalsFunction(["inspector-v2"], "umd");

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageAliasPath: `../../../dev/inspector-v2/dist`,
        devPackageName: "inspector-v2",
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
