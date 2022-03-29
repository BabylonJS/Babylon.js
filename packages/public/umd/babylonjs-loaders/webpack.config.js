const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "loaders",
        outputPath: path.resolve(__dirname),
        entryPoints: {
            loaders: "./src/index.ts",
            glTF1FileLoader: "./src/glTF1FileLoader.ts",
            glTF2FileLoader: "./src/glTF2FileLoader.ts",
            glTFFileLoader: "./src/glTFFileLoader.ts",
            objFileLoader: "./src/objFileLoader.ts",
            stlFileLoader: "./src/stlFileLoader.ts",
        },
        overrideFilename: (pathData) => {
            return pathData.chunk.name === "loaders" ? `babylonjs.[name]${env.production ? ".min" : ""}.js` : `babylon.[name]${env.production ? ".min" : ""}.js`;
        },
    });
    return commonConfig;
};
