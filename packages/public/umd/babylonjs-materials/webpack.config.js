const commonConfigGenerator = require("@dev/build-tools").webpackTools.commonUMDWebpackConfiguration;
const path = require("path");
module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageName: "materials",
        outputPath: path.resolve(__dirname),
        entryPoints: {
            materials: "./src/index.ts",
            cell: "./src/cell.ts",
            custom: "./src/custom.ts",
            fire: "./src/fire.ts",
            fur: "./src/fur.ts",
            gradient: "./src/gradient.ts",
            grid: "./src/grid.ts",
            lava: "./src/lava.ts",
            mix: "./src/mix.ts",
            normal: "./src/normal.ts",
            shadowOnly: "./src/shadowOnly.ts",
            simple: "./src/simple.ts",
            sky: "./src/sky.ts",
            terrain: "./src/terrain.ts",
            triPlanar: "./src/triPlanar.ts",
            water: "./src/water.ts",
        },
        alias: {
            materials: path.resolve(__dirname, "../../../dev/materials/src"),
            "@lts/materials": path.resolve(__dirname, "../../../lts/materials/src"),
        },
        overrideFilename: (pathData) => {
            return pathData.chunk.name === "materials" ? `babylonjs.[name]${env.production ? ".min" : ""}.js` : `babylon.[name]Material${env.production ? ".min" : ""}.js`;
        },
        minToMax: true,
    });
    return commonConfig;
};
