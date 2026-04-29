import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "addons",
    outputPath: path.resolve("."),
    entryPoints: {
        addons: "./src/index.ts",
    },
    alias: {
        addons: path.resolve("../../../dev/addons/src"),
    },
    overrideFilename: (pathData) => `babylonjs.${pathData.chunk.name}${mode === "production" ? ".min" : ""}.js`,
    minToMax: true,
});
