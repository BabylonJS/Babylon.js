const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "serializers",
        outputPath: path.resolve(__dirname),
        entryPoints: {
            serializers: "./src/index.ts",
            glTF2: "./src/glTF2.ts",
            obj: "./src/obj.ts",
            stl: "./src/stl.ts",
        },
        overrideFilename: (pathData) => {
            return pathData.chunk.name === "serializers" ? `babylonjs.[name]${env.production ? ".min" : ""}.js` : `babylon.[name]Serializer${env.production ? ".min" : ""}.js`;
        },
    });
    return commonConfig;
};
