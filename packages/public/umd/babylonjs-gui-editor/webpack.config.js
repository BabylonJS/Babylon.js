const path = require("path");
const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "gui-editor",
        devPackageAliasPath: `../../../tools/guiEditor/dist`,
        namespace: "GUIEDITOR",
        maxMode: true,
        alias: {
            "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
        },
        extendedWebpackConfig: {
            module: {
                rules: [
                    {
                        test: /\.(png|svg|jpg|jpeg|gif)$/i,
                        type: "asset/inline",
                    },
                    {
                        sideEffects: true,
                        test: /\.scss$/,
                        use: ["style-loader", "css-loader", "sass-loader"],
                    },
                ],
            },
        },
    });
    return commonConfig;
};
