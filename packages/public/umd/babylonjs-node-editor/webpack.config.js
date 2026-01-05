const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "node-editor",
        devPackageAliasPath: `../../../tools/nodeEditor/dist`,
        namespace: "NODEEDITOR",
        maxMode: true,
        minToMax: true,
        outputPath: path.resolve(__dirname),
        alias: {
            "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
        },
    });
    return commonConfig;
};
