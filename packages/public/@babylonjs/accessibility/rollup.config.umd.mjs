import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "accessibility",
    devPackageAliasPath: "../../../tools/accessibility/dist",
    es6Mode: true,
    maxMode: true,
});
