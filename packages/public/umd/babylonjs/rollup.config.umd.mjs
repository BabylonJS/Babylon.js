import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "core",
    namespace: "BABYLON",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
    alias: {
        core: path.resolve("../../../dev/core/src"),
    },
});
