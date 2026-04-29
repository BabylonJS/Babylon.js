import { defineConfig } from "vite";
import path from "path";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig((_env) => {
    const base = commonDevViteConfiguration({
        port: parseInt(process.env.NGE_PORT ?? "1343"),
        aliases: {
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
        },
        cdnExternals: {
            "@dev/core": "BABYLON",
            core: "BABYLON",
            loaders: "BABYLON",
            materials: "BABYLON",
            serializers: "BABYLON",
        },
        productionExternals: {
            babylonjs: "BABYLON",
            "babylonjs-loaders": "BABYLON",
            "babylonjs-materials": "BABYLON",
            "babylonjs-serializers": "BABYLON",
        },
    });

    return {
        ...base,
        plugins: [
            ...(base.plugins ?? []),
            {
                name: "node-geometry-editor-dev-shim",
                configureServer(server) {
                    server.middlewares.use("/babylon.nodeGeometryEditor.js", (_req, res) => {
                        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                        res.end(`(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) return;
    BABYLON.NodeGeometryEditor = BABYLON.NodeGeometryEditor || {};
    BABYLON.NodeGeometryEditor.Show = function () {
        var args = Array.prototype.slice.call(arguments);
        window.__viteNodeGeometryEditorArgs = args;
        window.dispatchEvent(new CustomEvent("babylonNodeGeometryEditorReady", { detail: { args: args } }));
    };
})();`);
                    });
                },
            },
        ],
    };
});
