import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const production = mode === "production";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "serializers",
    outputPath: path.resolve("."),
    entryPoints: {
        serializers: "./src/index.ts",
        glTF2: "./src/glTF2.ts",
        obj: "./src/obj.ts",
        stl: "./src/stl.ts",
        usdz: "./src/USDZ.ts",
        threemf: "./src/3mf.ts",
    },
    alias: {
        serializers: path.resolve("../../../dev/serializers/src"),
    },
    overrideFilename: (pathData) =>
        pathData.chunk.name === "serializers" ? `babylonjs.serializers${production ? ".min" : ""}.js` : `babylon.${pathData.chunk.name}Serializer${production ? ".min" : ""}.js`,
    minToMax: true,
});
