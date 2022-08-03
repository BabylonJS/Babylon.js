const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "html-twin-renderer",
        devPackageAliasPath: `../../../tools/accessibility/dist`,
        // namespace: "HTMLTWINRENDERER",
        es6Mode: true,
        maxMode: true,
    });
    return commonConfig;
};
