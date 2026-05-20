import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "inspector-legacy",
    devPackageAliasPath: devMode ? "../../../dev/inspector/src" : "../../../dev/inspector/dist",
    namespace: "INSPECTOR",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
    alias: {
        "shared-ui-components": path.resolve(devMode ? "../../../dev/sharedUiComponents/src" : "../../../dev/sharedUiComponents/dist"),
    },
});
