import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "accessibility",
    devPackageAliasPath: "../../../tools/accessibility/src",
    namespace: "ACCESSIBILITY",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
});
