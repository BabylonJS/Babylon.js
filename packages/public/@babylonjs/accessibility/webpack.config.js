const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "accessibility",
        devPackageAliasPath: `../../../tools/accessibility/dist`,
        es6Mode: true,
        maxMode: true,
    });
    return commonConfig;
};
