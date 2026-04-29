import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig((_env) => {
    const base = commonDevViteConfiguration({
        port: parseInt(process.env.GUIEDITOR_PORT ?? "1341"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
        },
        cdnExternals: {
            "@dev/core": "BABYLON",
            core: "BABYLON",
            gui: "BABYLON.GUI",
        },
        productionExternals: {
            babylonjs: "BABYLON",
            "babylonjs-gui": "BABYLON.GUI",
        },
    });

    return {
        ...base,
        plugins: [
            ...(base.plugins ?? []),
            {
                name: "gui-editor-dev-shim",
                configureServer(server) {
                    server.middlewares.use("/babylon.guiEditor.js", (_req, res) => {
                        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                        res.end(`(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    // index.js calls BABYLON.GuiEditor.Show (mixed case); also expose GUIEditor for
    // any code that uses the source-code class name directly.
    BABYLON.GuiEditor = BABYLON.GuiEditor || {};
    BABYLON.GuiEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteGuiEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonGuiEditorReady", { detail: { args: args } }));
    };
    BABYLON.GUIEditor = BABYLON.GuiEditor;
})();`);
                    });
                },
            },
        ],
    };
});
