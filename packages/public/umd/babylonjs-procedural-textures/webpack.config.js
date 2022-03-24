const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "procedural-textures",
        namespace: "PROCEDURALTEXTURES",
        outputPath: path.resolve(__dirname),
    });
    return commonConfig;
};