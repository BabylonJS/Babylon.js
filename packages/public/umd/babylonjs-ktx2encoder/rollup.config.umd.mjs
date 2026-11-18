import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "ktx2encoder",
    devPackageAliasPath: devMode ? "../../../tools/ktx2Encoder/src" : "../../../tools/ktx2Encoder/dist",
    namespace: "KTX2ENCODER",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
    alias: {
        core: path.resolve(devMode ? "../../../dev/core/src" : "../../../dev/core/dist"),
    },
    optionalExternalFunctionSkip: ["core"],
});
