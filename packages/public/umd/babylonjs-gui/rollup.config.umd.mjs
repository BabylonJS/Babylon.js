import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "gui",
    namespace: "BABYLON.GUI",
    outputPath: path.resolve("."),
    minToMax: true,
    alias: {
        gui: path.resolve("../../../dev/gui/src"),
    },
});
