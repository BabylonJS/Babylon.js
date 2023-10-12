const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const commonConfig = {
        entry: "./src/index.ts",
        ...webpackTools.commonDevWebpackConfiguration({
            mode: env.mode,
            outputFilename: "babylon.reflector.js",
            dirName: __dirname,
        }),
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
        },
        module: {
            rules: webpackTools.getRules(),
        },
    };
    return commonConfig;
};
