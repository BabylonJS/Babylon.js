import { defineConfig } from "vite";
import path from "path";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig((_env) => {
    const base = commonDevViteConfiguration({
        port: parseInt(process.env.NRGE_PORT ?? "1344"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            gui: path.resolve("../../dev/gui/dist"),
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
                name: "node-render-graph-editor-dev-shim",
                configureServer(server) {
                    server.middlewares.use("/babylon.nodeRenderGraphEditor.js", (_req, res) => {
                        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                        res.end(`(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.NodeRenderGraphEditor = BABYLON.NodeRenderGraphEditor || {};
    BABYLON.NodeRenderGraphEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteNodeRenderGraphEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonNodeRenderGraphEditorReady", { detail: { args: args } }));
    };
})();`);
                    });
                },
            },
        ],
    };
});
