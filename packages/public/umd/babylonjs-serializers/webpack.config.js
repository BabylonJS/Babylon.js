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
            usdz: "./src/USDZ.ts",
            threemf: "./src/3mf.ts",
        },
        alias: {
            serializers: path.resolve(__dirname, "../../../dev/serializers/src"),
            "@lts/serializers": path.resolve(__dirname, "../../../lts/serializers/src"),
        },
        overrideFilename: (pathData) => {
            return pathData.chunk.name === "serializers" ? `babylonjs.[name]${env.production ? ".min" : ""}.js` : `babylon.[name]Serializer${env.production ? ".min" : ""}.js`;
        },
        minToMax: true,
    });
    return commonConfig;
};
