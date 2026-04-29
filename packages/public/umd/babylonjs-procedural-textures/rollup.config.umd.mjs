import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const production = mode === "production";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "procedural-textures",
    namespace: "PROCEDURALTEXTURES",
    outputPath: path.resolve("."),
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
    alias: {
        "procedural-textures": path.resolve("../../../dev/proceduralTextures/src"),
    },
    overrideFilename: (pathData) =>
        pathData.chunk.name === "proceduralTextures"
            ? `babylonjs.proceduralTextures${production ? ".min" : ""}.js`
            : `babylon.${pathData.chunk.name}ProceduralTexture${production ? ".min" : ""}.js`,
    minToMax: true,
});
