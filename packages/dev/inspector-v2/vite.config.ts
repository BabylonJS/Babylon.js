import { defineConfig } from "vite";
import path from "path";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

export default defineConfig(
    commonDevViteConfiguration({
        port: parseInt(process.env.INSPECTOR_TEST_PORT ?? "9001"),
        aliases: {
            addons: path.resolve("../addons/dist"),
            core: path.resolve("../core/dist"),
            gui: path.resolve("../gui/dist"),
            loaders: path.resolve("../loaders/dist"),
            materials: path.resolve("../materials/dist"),
            "shared-ui-components": path.resolve("../sharedUiComponents/src"),
            inspector: path.resolve("./src"),
            serializers: path.resolve("../serializers/dist"),
            "node-editor": path.resolve("../../tools/nodeEditor/dist"),
            "node-geometry-editor": path.resolve("../../tools/nodeGeometryEditor/dist"),
            "node-particle-editor": path.resolve("../../tools/nodeParticleEditor/dist"),
            "node-render-graph-editor": path.resolve("../../tools/nodeRenderGraphEditor/dist"),
            "gui-editor": path.resolve("../../tools/guiEditor/dist"),
        },
        productionExternals: {},
    })
);
