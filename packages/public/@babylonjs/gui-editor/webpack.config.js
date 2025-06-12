const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "gui-editor",
        devPackageAliasPath: `../../../tools/guiEditor/dist`,
        namespace: "GUIEDITOR",
        es6Mode: true,
        maxMode: true,
        alias: {
            "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
        },
    });
    return commonConfig;
};
