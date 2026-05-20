import { commonUMDRollupConfiguration } from "../../public/rollupUMDHelper.mjs";
import { copyFileSync, cpSync, mkdirSync } from "fs";
import path from "path";

const mode = process.env.ROLLUP_MODE === "production" ? "production" : "development";
const devMode = process.env.ROLLUP_DEVMODE === "true";

const copyExtensionAssetsPlugin = {
    name: "copy-extension-assets",
    writeBundle() {
        mkdirSync("dist", { recursive: true });
        copyFileSync("src/assets/manifest.json", "dist/manifest.json");
        cpSync("src/assets/icons", "dist/icons", { recursive: true });
    },
};

const configs = commonUMDRollupConfiguration({
    mode,
    devMode,
    devPackageName: "smart-filters-debugger",
    namespace: "SMARTFILTERSDEBUGGER",
    outputPath: path.resolve("dist"),
    entryPoints: {
        background: "./src/background.ts",
        editorLauncher: "./src/editorLauncher.ts",
    },
    overrideFilename: ({ chunk }) => `scripts/${chunk.name}.js`,
    alias: {
        core: path.resolve("../../dev/core/dist"),
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
        "smart-filters": path.resolve("../../dev/smartFilters/dist"),
        "smart-filters-blocks": path.resolve("../../dev/smartFilterBlocks/dist"),
        "smart-filters-editor-control": path.resolve("../../tools/smartFiltersEditorControl/dist"),
    },
    optionalExternalFunctionSkip: ["core", "smart-filters"],
});

export default configs.map((config, index) => ({
    ...config,
    plugins: [...config.plugins, ...(index === 0 ? [copyExtensionAssetsPlugin] : [])],
}));
