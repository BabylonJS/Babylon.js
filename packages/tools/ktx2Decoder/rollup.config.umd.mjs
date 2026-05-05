import { commonUMDRollupConfiguration } from "../../public/rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "ktx2decoder",
    namespace: "KTX2DECODER",
    outputPath: path.resolve("dist"),
    maxMode: true,
    minToMax: true,
    alias: {
        core: path.resolve("../../dev/core/dist"),
    },
    optionalExternalFunctionSkip: ["core"],
});
