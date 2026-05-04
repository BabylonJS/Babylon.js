import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "gui",
    namespace: "BABYLON.GUI",
    outputPath: path.resolve("."),
    minToMax: true,
    alias: {
        gui: path.resolve("../../../dev/gui/src"),
    },
});
