const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "post-processes",
        namespace: "POSTPROCESSES",
        outputPath: path.resolve(__dirname),
    });
    return commonConfig;
};