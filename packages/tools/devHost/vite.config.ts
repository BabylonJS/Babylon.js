import path from "path";
import { readFile } from "fs";
import { fileURLToPath } from "url";
import { defineConfig, normalizePath, type Plugin, type UserConfig } from "vite";
// @ts-ignore -- untyped JS helper
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

// Serve the Havok physics WASM (used by the flowgraph showcase) from node_modules
// during dev. The Havok ESM loader requests "/HavokPhysics.wasm" at runtime.
const HavokWasmFilePath = fileURLToPath(new URL("../../../node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm", import.meta.url));

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
                readFile(HavokWasmFilePath, (error, wasm) => {
                    if (error) {
                        // Havok is an optional dependency. When the wasm file isn't installed,
                        // respond with a clean 404 instead of forwarding the error to Vite, which
                        // would surface a noisy 500 + error overlay across the whole devHost.
                        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                            response.statusCode = 404;
                            response.end();
                            return;
                        }
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

const OptionalPeerDependencies = ["draco3dgltf", "ammo.js", "cannon", "oimo", "recast", "havok", "basis_transcoder"];
const OptionalPeerDependencyPattern = OptionalPeerDependencies.map((p) => p.replace(".", "\\.")).join("|");
const LottieWorkerEntry = path.resolve("../../dev/lottiePlayer/src/worker.ts");
const LottiePlayerEntry = normalizePath(path.resolve("../../dev/lottiePlayer/src/player.ts"));
const LottieWorkerDevUrl = "/__lottie-worker.js";
const LottieWorkerUrlExpression = /new URL\(["']\.\/worker(?:\.[jt]s)?["'],\s*import\.meta\.url\)/g;

function stubNamedOptionalPeerDependencyImport(bindings: string): string {
    return bindings
        .split(",")
        .map((s) =>
            s
                .trim()
                .split(/\s+as\s+/)
                .pop()!
                .trim()
        )
        .filter((n) => Boolean(n) && !n.startsWith("type "))
        .map((n) => `const ${n} = undefined;`)
        .join(" ");
}

function stubOptionalPeerDependencyImports(code: string): string {
    if (!OptionalPeerDependencies.some((p) => code.includes(`"${p}"`) || code.includes(`'${p}'`))) {
        return code;
    }

    const typeNamedRe = new RegExp(`import\\s+type\\s+\\{[^}]*\\}\\s+from\\s+['"](?:${OptionalPeerDependencyPattern})['"];?`, "g");
    const namedRe = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"](?:${OptionalPeerDependencyPattern})['"];?`, "g");
    const starRe = new RegExp(`import\\s+(?:type\\s+)?\\*\\s+as\\s+(\\w+)\\s+from\\s+['"](?:${OptionalPeerDependencyPattern})['"];?`, "g");
    const defaultRe = new RegExp(`import\\s+(?:type\\s+)?(\\w+)\\s+from\\s+['"](?:${OptionalPeerDependencyPattern})['"];?`, "g");
    const sideEffectRe = new RegExp(`import\\s+['"](?:${OptionalPeerDependencyPattern})['"];?`, "g");

    return code
        .replace(typeNamedRe, "")
        .replace(namedRe, (_m, bindings: string) => stubNamedOptionalPeerDependencyImport(bindings))
        .replace(starRe, (_m, ns: string) => `const ${ns} = {};`)
        .replace(defaultRe, (_m, def: string) => `const ${def} = undefined;`)
        .replace(sideEffectRe, "");
}

function lottieClassicWorkerPlugin(aliases: Record<string, string>): Plugin {
    let bundlePromise: Promise<string> | undefined;
    let command: "build" | "serve" = "serve";
    let mode = "development";
    let sourcemap: boolean | "inline" = "inline";

    const bundleWorker = async (): Promise<string> => {
        bundlePromise ??= import("esbuild")
            .then(async ({ build }) => {
                const result = await build({
                    entryPoints: [LottieWorkerEntry],
                    bundle: true,
                    write: false,
                    format: "iife",
                    platform: "browser",
                    target: "es2020",
                    sourcemap,
                    alias: aliases,
                    define: {
                        "process.env.NODE_ENV": JSON.stringify(mode),
                    },
                });
                return result.outputFiles[0].text;
            })
            .catch((error: unknown) => {
                bundlePromise = undefined;
                throw error;
            });

        return bundlePromise;
    };

    return {
        name: "lottie-classic-worker",
        enforce: "pre",
        configResolved(config) {
            command = config.command;
            mode = config.mode;
            sourcemap = command === "serve" ? "inline" : config.build.sourcemap === "inline" ? "inline" : Boolean(config.build.sourcemap);
        },
        async transform(code, id) {
            if (normalizePath(id.split("?")[0]) !== LottiePlayerEntry || !code.includes("./worker")) {
                return null;
            }

            const workerUrl =
                command === "serve"
                    ? `new URL("${LottieWorkerDevUrl}", globalThis.location.href)`
                    : `new URL(import.meta.ROLLUP_FILE_URL_${this.emitFile({ type: "asset", fileName: "assets/lottieWorker.js", source: await bundleWorker() })}, import.meta.url)`;
            const transformedCode = code.replace(LottieWorkerUrlExpression, workerUrl);
            if (transformedCode === code) {
                return null;
            }

            return { code: transformedCode, map: null };
        },
        configureServer(server) {
            server.watcher.on("change", () => (bundlePromise = undefined));

            server.middlewares.use(async (req, res, next) => {
                const pathname = req.url?.split(/[?#]/)[0] ?? "";
                if (pathname !== LottieWorkerDevUrl) {
                    next();
                    return;
                }

                try {
                    const workerCode = await bundleWorker();
                    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
                    res.end(workerCode);
                } catch (error) {
                    next(error);
                }
            });
        },
    };
}

/**
 * Stub optional peer dependencies that core/src references but that are not
 * installed in the dev workspace (e.g. draco3dgltf, ammo.js). Vite needs an
 * explicit transform plugin for these optional imports.
 *
 * Strategy: rewrite the import statements in consuming source files rather than
 * trying to stub the module itself, since ESM named imports require explicit
 * exports and we cannot enumerate them dynamically.
 *
 *   import { DracoDecoderModule } from "draco3dgltf"
 *   → const DracoDecoderModule = undefined;
 */
function stubOptionalPeerDepsPlugin(): Plugin {
    return {
        name: "stub-optional-peer-deps",
        enforce: "pre",
        transform(code, id) {
            if (!/\.[tj]sx?$/.test(id)) return null;
            const transformedCode = stubOptionalPeerDependencyImports(code);
            if (transformedCode === code) return null;

            return {
                code: transformedCode,
                map: null,
            };
        },
    };
}

export default defineConfig((_env) => {
    const aliases = {
        core: path.resolve("../../dev/core/src"),
        gui: path.resolve("../../dev/gui/src"),
        serializers: path.resolve("../../dev/serializers/src"),
        loaders: path.resolve("../../dev/loaders/src"),
        materials: path.resolve("../../dev/materials/src"),
        "lottie-player": path.resolve("../../dev/lottiePlayer/src"),
        inspector: path.resolve("../../dev/inspector/src"),
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
        "post-processes": path.resolve("../../dev/postProcesses/src"),
        "procedural-textures": path.resolve("../../dev/proceduralTextures/src"),
        "node-editor": path.resolve("../../tools/nodeEditor/src"),
        "node-geometry-editor": path.resolve("../../tools/nodeGeometryEditor/src"),
        "node-render-graph-editor": path.resolve("../../tools/nodeRenderGraphEditor/src"),
        "node-particle-editor": path.resolve("../../tools/nodeParticleEditor/src"),
        "gui-editor": path.resolve("../../tools/guiEditor/src"),
        accessibility: path.resolve("../../tools/accessibility/src"),
        "babylonjs-gltf2interface": path.resolve("./src/babylon.glTF2Interface.ts"),
    };

    const base = commonDevViteConfiguration({
        port: parseInt(process.env.TOOLS_PORT ?? "1338"),
        aliases,
    }) as unknown as UserConfig;

    return {
        ...base,
        plugins: [...(base.plugins ?? []), lottieClassicWorkerPlugin(aliases), stubOptionalPeerDepsPlugin(), serveHavokWasmPlugin()],
    };
});
