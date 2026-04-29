import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "node-particle-editor",
    devPackageAliasPath: "../../../tools/nodeParticleEditor/src",
    namespace: "NODEPARTICLEEDITOR",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
    alias: {
        "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
    },
});
