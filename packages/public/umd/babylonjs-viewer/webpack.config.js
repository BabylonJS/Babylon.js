const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "viewer",
        devPackageAliasPath: `../../../tools/viewer/dist`,
        namespace: "BabylonViewer",
        maxMode: true,
        outputPath: path.resolve(__dirname),
        alias: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            // "handlebars/runtime": "handlebars/dist/cjs/handlebars.runtime",
            handlebars: "handlebars/dist/handlebars.js",
            core: `@dev/core/dist`,
            loaders: `@dev/loaders/dist`,
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
