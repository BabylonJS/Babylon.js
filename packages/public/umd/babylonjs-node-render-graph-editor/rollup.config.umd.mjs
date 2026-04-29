import { commonUMDRollupConfiguration } from "../../rollupUMDHelper.mjs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";

export default commonUMDRollupConfiguration({
    mode,
    devPackageName: "node-render-graph-editor",
    devPackageAliasPath: "../../../tools/nodeRenderGraphEditor/src",
    namespace: "NODERENDERGRAPHEDITOR",
    outputPath: path.resolve("."),
    maxMode: true,
    minToMax: true,
    alias: {
        "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
    },
});
