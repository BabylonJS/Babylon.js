import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.VIEWER_CONFIGURATOR_PORT ?? "3003"),
        aliases: {
            "core": path.resolve("../../dev/core/dist"),
            "loaders": path.resolve("../../dev/loaders/dist"),
            "materials": path.resolve("../../dev/materials/dist"),
            "viewer": path.resolve("../viewer/dist/tsbuild"),
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src")
        },
        productionExternals: {

        },
    })
);
