const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "addons",
        outputPath: path.resolve(__dirname),
        entryPoints: {
            addons: "./src/index.ts",
        },
        alias: {
            addons: path.resolve(__dirname, "../../../dev/addons/src"),
        },
        overrideFilename: (pathData) => {
            return `babylonjs.[name]${env.production ? ".min" : ""}.js`;
        },
    });
    return commonConfig;
};
