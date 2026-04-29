import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.VSM_PORT ?? "1342"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            "core": path.resolve("../../dev/core/dist"),
            "gui": path.resolve("../../dev/gui/dist")
        },
        productionExternals: {
            "babylonjs": "BABYLON",
            "babylonjs-gui": "BABYLON.GUI"
        },
    })
);
