import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "accessibility",
    devPackageAliasPath: "../../../tools/accessibility/dist",
    namespace: "ACCESSIBILITY",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
});
