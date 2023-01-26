const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "ktx2decoder",
        namespace: "KTX2DECODER",
        alias: {
            "core": path.resolve(__dirname, "../../dev/core/dist"),
        },
        extendedWebpackConfig: {
            externals: {},
            module: {
                rules: require("@dev/build-tools").webpackTools.getRules({
                    sideEffects: true,
                    includeCSS: true,
                }),
            },
        }
    });
    return commonConfig;
};
