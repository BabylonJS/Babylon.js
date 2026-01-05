const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "node-geometry-editor",
        devPackageAliasPath: `../../../tools/nodeGeometryEditor/dist`,
        namespace: "NODEGEOMETRYEDITOR",
        maxMode: true,
        minToMax: true,
        outputPath: path.resolve(__dirname),
        alias: {
            "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
        },
    });
    return commonConfig;
};
