import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const production = mode === "production";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "post-processes",
    namespace: "POSTPROCESSES",
    outputPath: path.resolve("."),
    entryPoints: {
        postProcess: "./src/index.ts",
        asciiArt: "./src/asciiArt.ts",
        digitalRain: "./src/digitalRain.ts",
    },
    alias: {
        "post-processes": path.resolve("../../../dev/postProcesses/src"),
    },
    overrideFilename: (pathData) =>
        pathData.chunk.name === "postProcess" ? `babylonjs.postProcess${production ? ".min" : ""}.js` : `babylon.${pathData.chunk.name}PostProcess${production ? ".min" : ""}.js`,
    minToMax: true,
});
