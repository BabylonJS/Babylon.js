import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.SFE_PORT ?? "1346"),
        aliases: {
            // Smart Filters packages (resolve from dist — built by watch:dev)
            core: path.resolve("../../dev/core/dist"),
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
            "smart-filters": path.resolve("../../dev/smartFilters/dist"),
            "smart-filters-blocks": path.resolve("../../dev/smartFilterBlocks/dist"),
            "smart-filters-editor-control": path.resolve("../smartFiltersEditorControl/dist"),
        },
        // smartFiltersEditor bundles everything; no CDN externals needed.
        productionExternals: {},
        outDir: "dist",
    })
);
