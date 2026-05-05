import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

export default commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "node-editor",
    devPackageAliasPath: "../../../tools/nodeEditor/dist",
    namespace: "NODEEDITOR",
    es6Mode: true,
    maxMode: true,
    minToMax: true,
    alias: {
        "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
    },
});
