import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";
const production = mode === "production";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "loaders",
    outputPath: path.resolve("."),
    entryPoints: {
        loaders: "./src/index.ts",
        bvhFileLoader: "./src/bvhFileLoader.ts",
        glTF1FileLoader: "./src/glTF1FileLoader.ts",
        glTF2FileLoader: "./src/glTF2FileLoader.ts",
        glTFFileLoader: "./src/glTFFileLoader.ts",
        objFileLoader: "./src/objFileLoader.ts",
        stlFileLoader: "./src/stlFileLoader.ts",
    },
    alias: {
        loaders: path.resolve("../../../dev/loaders/src"),
    },
    overrideFilename: (pathData) =>
        pathData.chunk.name === "loaders" ? `babylonjs.loaders${production ? ".min" : ""}.js` : `babylon.${pathData.chunk.name}${production ? ".min" : ""}.js`,
    minToMax: true,
});
