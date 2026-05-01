import { defineConfig } from "vite";
import path from "path";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig((_env) => {
    const base = commonDevViteConfiguration({
        port: parseInt(process.env.FGE_PORT ?? "1347"),
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
                name: "flow-graph-editor-dev-shim",
                configureServer(server) {
                    server.middlewares.use("/babylon.flowGraphEditor.js", (_req, res) => {
                        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                        res.end(`(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.FlowGraphEditor = BABYLON.FlowGraphEditor || {};
    BABYLON.FlowGraphEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteFlowGraphEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonFlowGraphEditorReady", { detail: { args: args } }));
    };
})();`);
                    });
                },
            },
        ],
    };
});
