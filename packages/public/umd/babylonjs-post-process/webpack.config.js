const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "post-processes",
        namespace: "POSTPROCESSES",
        outputPath: path.resolve(__dirname),
        entryPoints: {
            postProcess: "./src/index.ts",
            asciiArt: "./src/asciiArt.ts",
            digitalRain: "./src/digitalRain.ts",
        },
        alias: {
            "post-processes": path.resolve(__dirname, "../../../dev/postProcesses/src"),
            "@lts/post-processes": path.resolve(__dirname, "../../../lts/postProcesses/src"),
        },
        overrideFilename: (pathData) => {
            return pathData.chunk.name === "postProcess" ? `babylonjs.[name]${env.production ? ".min" : ""}.js` : `babylon.[name]PostProcess${env.production ? ".min" : ""}.js`;
        },
        minToMax: true,
    });
    return commonConfig;
};
