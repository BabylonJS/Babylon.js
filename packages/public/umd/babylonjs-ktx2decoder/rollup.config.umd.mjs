import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";

// ktx2decoder bundles @dev/core rather than externalising it, matching the
// original extendedWebpackConfig: { externals: {} } behaviour.
export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "ktx2decoder",
    devPackageAliasPath: "../../../tools/ktx2Decoder/dist",
    namespace: "KTX2DECODER",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
    alias: {
        core: path.resolve("../../../dev/core/dist"),
    },
    // Bundle core rather than referencing the BABYLON global,
    // because ktx2decoder is a standalone module with no external deps.
    optionalExternalFunctionSkip: ["core"],
});
