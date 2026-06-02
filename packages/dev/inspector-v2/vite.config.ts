import { readFile } from "fs";
import { fileURLToPath } from "url";
import { defineConfig, mergeConfig, type Plugin } from "vite";
import path from "path";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

const havokWasmFilePath = fileURLToPath(new URL("../../../node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm", import.meta.url));

function serveHavokWasmPlugin(): Plugin {
    return {
        name: "serve-havok-wasm",
        configureServer(server) {
            server.middlewares.use((request, response, next) => {
                const requestPath = request.url?.split("?", 1)[0];
                if (!requestPath?.endsWith("/HavokPhysics.wasm")) {
                    next();
                    return;
                }

                readFile(havokWasmFilePath, (error, wasm) => {
                    if (error) {
                        next(error);
                        return;
                    }

                    response.statusCode = 200;
                    response.setHeader("Content-Type", "application/wasm");
                    response.setHeader("Cache-Control", "no-cache");
                    response.end(wasm);
                });
            });
        },
    };
}

export default defineConfig(
    mergeConfig(
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
        }),
        {
            plugins: [serveHavokWasmPlugin()],
        }
    )
);
