import { defineConfig } from "vite";
import path from "path";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig((_env) => {
    const base = commonDevViteConfiguration({
        port: parseInt(process.env.NME_PORT ?? "1340"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
        },
        cdnExternals: {
            "@dev/core": "BABYLON",
            core: "BABYLON",
            loaders: "BABYLON",
        },
        productionExternals: {
            babylonjs: "BABYLON",
            "babylonjs-loaders": "BABYLON",
        },
    });

    return {
        ...base,
        plugins: [
            ...(base.plugins ?? []),
            {
                // Shim for /babylon.nodeEditor.js: captures BABYLON.NodeEditor.Show() args
                // from public/index.js and relays them to main.ts via CustomEvent.
                name: "node-editor-dev-shim",
                configureServer(server) {
                    server.middlewares.use("/babylon.nodeEditor.js", (_req, res) => {
                        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                        res.end(`(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.NodeEditor = BABYLON.NodeEditor || {};
    BABYLON.NodeEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteNodeEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonNodeEditorReady", { detail: { args: args } }));
    };
})();`);
                    });
                },
            },
        ],
    };
});
