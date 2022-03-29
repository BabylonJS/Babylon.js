const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "procedural-textures",
        namespace: "PROCEDURALTEXTURES",
        outputPath: path.resolve(__dirname),
        entryPoints: {
            proceduralTextures: "./src/index.ts",
            brick: "./src/brick.ts",
            cloud: "./src/cloud.ts",
            fire: "./src/fire.ts",
            grass: "./src/grass.ts",
            marble: "./src/marble.ts",
            normalMap: "./src/normalMap.ts",
            perlinNoise: "./src/perlinNoise.ts",
            road: "./src/road.ts",
            starfield: "./src/starfield.ts",
            wood: "./src/wood.ts",
        },
        overrideFilename: (pathData) => {
            return pathData.chunk.name === "proceduralTextures" ? `babylonjs.[name]${env.production ? ".min" : ""}.js` : `babylon.[name]ProceduralTexture${env.production ? ".min" : ""}.js`;
        },
    });
    return commonConfig;
};