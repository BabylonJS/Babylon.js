const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "html-twin-renderer",
        devPackageAliasPath: `../../../tools/accessibility/dist`,
        namespace: "HTMLTWINRENDERER",
        outputPath: path.resolve(__dirname),
        maxMode: true,
    });
    return commonConfig;
};
