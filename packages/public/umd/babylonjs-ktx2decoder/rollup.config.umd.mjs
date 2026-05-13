import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

// ktx2decoder bundles @dev/core rather than externalising it.
export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "ktx2decoder",
    devPackageAliasPath: devMode ? "../../../tools/ktx2Decoder/src" : "../../../tools/ktx2Decoder/dist",
    namespace: "KTX2DECODER",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
    alias: {
        core: path.resolve(devMode ? "../../../dev/core/src" : "../../../dev/core/dist"),
    },
    // Bundle core rather than referencing the BABYLON global,
    // because ktx2decoder is a standalone module with no external deps.
    optionalExternalFunctionSkip: ["core"],
});
