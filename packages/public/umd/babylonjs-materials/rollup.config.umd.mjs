import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const production = mode === "production";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "materials",
    outputPath: path.resolve("."),
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
        materials: path.resolve("../../../dev/materials/src"),
    },
    overrideFilename: (pathData) =>
        pathData.chunk.name === "materials" ? `babylonjs.materials${production ? ".min" : ""}.js` : `babylon.${pathData.chunk.name}Material${production ? ".min" : ""}.js`,
    minToMax: true,
});
