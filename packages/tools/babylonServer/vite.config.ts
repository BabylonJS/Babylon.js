import { defineConfig, type Plugin, type Connect } from "vite";
import path from "path";
import fs from "fs";
import { type ChildProcess, spawn } from "child_process";
import { watch as chokidarWatch } from "chokidar";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const UMD_ROOT = path.resolve(__dirname, "../../public/umd");
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DEV_ROOT = path.resolve(__dirname, "../../dev");
const TOOLS_ROOT = path.resolve(__dirname, "../../tools");

function getCdnPort() {
    const portText = process.env.CDN_PORT ?? "1337";
    const cdnPort = Number(portText);

    if (!Number.isInteger(cdnPort) || cdnPort < 1 || cdnPort > 65535) {
        throw new Error(`CDN_PORT must be an integer between 1 and 65535. Received: ${portText}`);
    }

    return cdnPort;
}

/**
 * Maps URL paths to files in the rollup UMD output directories.
 * Each entry: [url path prefix (no leading slash), umd package dir, file pattern]
 *
 * The previous dev server had entries like:
 *   "gui/babylon.gui.min": `./src/gui/index-dev.ts`
 * which produced `/gui/babylon.gui.min.js` served at that URL.
 *
 * With rollup UMD builds, the output lives in packages/public/umd/<package>/<file>.
 * This map connects the URL space to those files.
 */
const umdUrlMap: Record<string, { dir: string; file: string }> = {
    // Core
    "babylon.js": { dir: "babylonjs", file: "babylon.max.js" },
    "babylon.max.js": { dir: "babylonjs", file: "babylon.max.js" },

    // GUI
    "gui/babylon.gui.min.js": { dir: "babylonjs-gui", file: "babylon.gui.js" },
    "gui/babylon.gui.js": { dir: "babylonjs-gui", file: "babylon.gui.js" },

    // Inspector (legacy)
    "inspector/babylon.inspector.min.js": { dir: "babylonjs-inspector", file: "babylon.inspector.bundle.max.js" },
    "inspector/babylon.inspector.bundle.js": { dir: "babylonjs-inspector", file: "babylon.inspector.bundle.max.js" },

    // Inspector v2
    "inspector/babylon.inspector-v2.bundle.js": { dir: "babylonjs-inspector-v2", file: "babylon.inspector-v2.bundle.max.js" },
    "inspector/babylon.inspector-v2.bundle.max.js": { dir: "babylonjs-inspector-v2", file: "babylon.inspector-v2.bundle.max.js" },

    // Serializers
    "serializers/babylonjs.serializers.min.js": { dir: "babylonjs-serializers", file: "babylonjs.serializers.js" },
    "serializers/babylonjs.serializers.js": { dir: "babylonjs-serializers", file: "babylonjs.serializers.js" },

    // Loaders
    "loaders/babylonjs.loaders.min.js": { dir: "babylonjs-loaders", file: "babylonjs.loaders.js" },
    "loaders/babylonjs.loaders.js": { dir: "babylonjs-loaders", file: "babylonjs.loaders.js" },

    // Materials
    "materialsLibrary/babylonjs.materials.min.js": { dir: "babylonjs-materials", file: "babylonjs.materials.js" },
    "materialsLibrary/babylonjs.materials.js": { dir: "babylonjs-materials", file: "babylonjs.materials.js" },

    // Post Processes
    "postProcessesLibrary/babylonjs.postProcess.min.js": { dir: "babylonjs-post-process", file: "babylonjs.postProcess.js" },
    "postProcessesLibrary/babylonjs.postProcess.js": { dir: "babylonjs-post-process", file: "babylonjs.postProcess.js" },

    // Procedural Textures
    "proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js": { dir: "babylonjs-procedural-textures", file: "babylonjs.proceduralTextures.js" },
    "proceduralTexturesLibrary/babylonjs.proceduralTextures.js": { dir: "babylonjs-procedural-textures", file: "babylonjs.proceduralTextures.js" },

    // Node Editor
    "nodeEditor/babylon.nodeEditor.min.js": { dir: "babylonjs-node-editor", file: "babylon.nodeEditor.max.js" },
    "nodeEditor/babylon.nodeEditor.js": { dir: "babylonjs-node-editor", file: "babylon.nodeEditor.max.js" },

    // Node Geometry Editor
    "nodeGeometryEditor/babylon.nodeGeometryEditor.min.js": { dir: "babylonjs-node-geometry-editor", file: "babylon.nodeGeometryEditor.max.js" },
    "nodeGeometryEditor/babylon.nodeGeometryEditor.js": { dir: "babylonjs-node-geometry-editor", file: "babylon.nodeGeometryEditor.max.js" },

    // Node Render Graph Editor
    "nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.min.js": { dir: "babylonjs-node-render-graph-editor", file: "babylon.nodeRenderGraphEditor.max.js" },
    "nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.js": { dir: "babylonjs-node-render-graph-editor", file: "babylon.nodeRenderGraphEditor.max.js" },

    // Node Particle Editor
    "nodeParticleEditor/babylon.nodeParticleEditor.min.js": { dir: "babylonjs-node-particle-editor", file: "babylon.nodeParticleEditor.max.js" },
    "nodeParticleEditor/babylon.nodeParticleEditor.js": { dir: "babylonjs-node-particle-editor", file: "babylon.nodeParticleEditor.max.js" },

    // GUI Editor
    "guiEditor/babylon.guiEditor.min.js": { dir: "babylonjs-gui-editor", file: "babylon.guiEditor.max.js" },
    "guiEditor/babylon.guiEditor.js": { dir: "babylonjs-gui-editor", file: "babylon.guiEditor.max.js" },

    // Accessibility
    "accessibility/babylon.accessibility.min.js": { dir: "babylonjs-accessibility", file: "babylon.accessibility.max.js" },
    "accessibility/babylon.accessibility.js": { dir: "babylonjs-accessibility", file: "babylon.accessibility.max.js" },

    // Addons
    "addons/babylonjs.addons.min.js": { dir: "babylonjs-addons", file: "babylonjs.addons.js" },
    "addons/babylonjs.addons.js": { dir: "babylonjs-addons", file: "babylonjs.addons.js" },

    // KTX2 Decoder
    "babylon.ktx2Decoder.js": { dir: "babylonjs-ktx2decoder", file: "babylon.ktx2Decoder.max.js" },
};

/**
 * Declaration file URL rewrites — maps URL paths to files in the declarations/ dir.
 * Mirrors the legacy dev-server rewrites for .d.ts files.
 */
const declarationRewrites: Record<string, string> = {
    "babylon.d.ts": "core.d.ts",
    "gui/babylon.gui.d.ts": "gui.d.ts",
    "inspector/babylon.inspector.d.ts": "inspector.d.ts",
    "inspector/babylon.inspector-v2.d.ts": "inspector-v2.d.ts",
    "nodeEditor/babylon.nodeEditor.d.ts": "node-editor.d.ts",
    "nodeGeometryEditor/babylon.nodeGeometryEditor.d.ts": "node-geometry-editor.d.ts",
    "nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.d.ts": "node-render-graph-editor.d.ts",
    "nodeParticleEditor/babylon.nodeParticleEditor.d.ts": "node-particle-editor.d.ts",
    "flowGraphEditor/babylon.flowGraphEditor.d.ts": "flow-graph-editor.d.ts",
    "guiEditor/babylon.guiEditor.d.ts": "gui-editor.d.ts",
    "accessibility/babylon.accessibility.d.ts": "accessibility.d.ts",
    "loaders/babylonjs.loaders.d.ts": "loaders.d.ts",
    "materialsLibrary/babylonjs.materials.d.ts": "materials.d.ts",
    "postProcessesLibrary/babylonjs.postProcess.d.ts": "post-processes.d.ts",
    "proceduralTexturesLibrary/babylonjs.proceduralTextures.d.ts": "procedural-textures.d.ts",
    "serializers/babylonjs.serializers.d.ts": "serializers.d.ts",
    "addons/babylonjs.addons.d.ts": "addons.d.ts",
};

const staticDeclarationRewrites: Record<string, string> = {
    "glTF2Interface/babylon.glTF2Interface.d.ts": path.resolve(REPO_ROOT, "packages/public/glTF2Interface/babylon.glTF2Interface.d.ts"),
};

function getUmdEntry(url: string) {
    const directEntry = umdUrlMap[url];
    if (directEntry) {
        return directEntry;
    }

    const urlDir = path.posix.dirname(url);
    const urlFile = path.posix.basename(url);
    return Object.entries(umdUrlMap).find(([mappedUrl, entry]) => path.posix.dirname(mappedUrl) === urlDir && entry.file === urlFile)?.[1];
}

/**
 * Vite plugin that serves pre-built rollup UMD bundles and handles URL rewrites.
 * Replaces the old entry-point compilation and dev-server configuration.
 *
 * Features:
 * - Serves UMD bundles from rollup output directories
 * - Request logging (disable with NO_LOG=true)
 * - Source file watching — rebuilds affected UMD packages on change (disable with NO_WATCH=true)
 * - Browser full-reload when UMD output changes (enable with ENABLE_LIVE_RELOAD=true)
 */
function babylonServerPlugin(): Plugin {
    const declarationsDir = path.resolve(__dirname, "declarations");
    const playgroundPublic = path.resolve(__dirname, "../playground/public");
    const enableLog = process.env.NO_LOG !== "true";
    const enableWatch = process.env.NO_WATCH !== "true";
    const enableLiveReload = process.env.ENABLE_LIVE_RELOAD === "true";

    /**
     * Maps source paths to their affected UMD npm workspace names.
     * When a file under a source path changes, the corresponding UMD packages are rebuilt.
     */
    const sourceToPackage: Array<{ srcDir: string; packages: string[] }> = [
        { srcDir: path.join(DEV_ROOT, "core/src"), packages: ["babylonjs"] },
        { srcDir: path.join(DEV_ROOT, "core/src/Materials/Textures/ktx2decoderTypes.ts"), packages: ["babylonjs-ktx2decoder"] },
        { srcDir: path.join(DEV_ROOT, "gui/src"), packages: ["babylonjs-gui"] },
        { srcDir: path.join(DEV_ROOT, "loaders/src"), packages: ["babylonjs-loaders"] },
        { srcDir: path.join(DEV_ROOT, "serializers/src"), packages: ["babylonjs-serializers"] },
        { srcDir: path.join(DEV_ROOT, "materials/src"), packages: ["babylonjs-materials"] },
        { srcDir: path.join(DEV_ROOT, "postProcesses/src"), packages: ["babylonjs-post-process"] },
        { srcDir: path.join(DEV_ROOT, "proceduralTextures/src"), packages: ["babylonjs-procedural-textures"] },
        { srcDir: path.join(DEV_ROOT, "inspector/src"), packages: ["babylonjs-inspector-legacy"] },
        { srcDir: path.join(DEV_ROOT, "inspector-v2/src"), packages: ["babylonjs-inspector"] },
        { srcDir: path.join(DEV_ROOT, "addons/src"), packages: ["babylonjs-addons"] },
        {
            srcDir: path.join(DEV_ROOT, "sharedUiComponents/src"),
            packages: [
                "babylonjs-inspector-legacy",
                "babylonjs-inspector",
                "babylonjs-node-editor",
                "babylonjs-node-geometry-editor",
                "babylonjs-node-render-graph-editor",
                "babylonjs-node-particle-editor",
                "babylonjs-gui-editor",
            ],
        },
        { srcDir: path.join(TOOLS_ROOT, "nodeEditor/src"), packages: ["babylonjs-node-editor"] },
        { srcDir: path.join(TOOLS_ROOT, "nodeGeometryEditor/src"), packages: ["babylonjs-node-geometry-editor"] },
        { srcDir: path.join(TOOLS_ROOT, "nodeRenderGraphEditor/src"), packages: ["babylonjs-node-render-graph-editor"] },
        { srcDir: path.join(TOOLS_ROOT, "nodeParticleEditor/src"), packages: ["babylonjs-node-particle-editor"] },
        { srcDir: path.join(TOOLS_ROOT, "guiEditor/src"), packages: ["babylonjs-gui-editor"] },
        { srcDir: path.join(TOOLS_ROOT, "accessibility/src"), packages: ["babylonjs-accessibility"] },
        { srcDir: path.join(TOOLS_ROOT, "ktx2Decoder/src"), packages: ["babylonjs-ktx2decoder"] },
    ];

    /** Tracks in-flight builds to avoid overlapping rebuilds of the same package. */
    const building = new Set<string>();
    /** Child processes to clean up on server close. */
    const children: ChildProcess[] = [];

    function stampPackage(pkg: string) {
        return new Promise<{ code: number; stderr: string }>((resolvePromise) => {
            const child = spawn("node", ["packages/tools/babylonServer/scripts/ensureUmdBuilds.mjs", "--stamp", pkg], {
                cwd: REPO_ROOT,
                stdio: ["ignore", "ignore", "pipe"],
                shell: true,
            });
            children.push(child);

            let stderr = "";
            child.stderr?.on("data", (data: Buffer) => (stderr += data));
            child.on("close", (code) => {
                const index = children.indexOf(child);
                if (index >= 0) {
                    children.splice(index, 1);
                }
                resolvePromise({ code: code ?? 1, stderr });
            });
        });
    }

    function rebuildPackage(pkg: string, server: { ws: { send: (msg: any) => void } }) {
        if (building.has(pkg)) return;
        building.add(pkg);
        const startTime = Date.now();
        console.log(`\x1b[33m⚡ Rebuilding ${pkg}...\x1b[0m`);

        const child = spawn("npm", ["run", "build:dev:fast", "-w", pkg], {
            cwd: REPO_ROOT,
            stdio: ["ignore", "ignore", "pipe"],
            shell: true,
        });
        children.push(child);

        let stderr = "";
        child.stderr?.on("data", (d: Buffer) => (stderr += d));
        child.on("close", async (code) => {
            const idx = children.indexOf(child);
            if (idx >= 0) children.splice(idx, 1);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            if (code === 0) {
                const stampResult = await stampPackage(pkg);
                if (stampResult.code !== 0) {
                    console.warn(`\x1b[33m⚠ Could not mark ${pkg} as fresh: ${stampResult.stderr.trim()}\x1b[0m`);
                }
                console.log(`\x1b[32m✓ ${pkg} rebuilt in ${elapsed}s\x1b[0m`);
                if (enableLiveReload) {
                    server.ws.send({ type: "full-reload" });
                }
            } else {
                console.error(`\x1b[31m✗ ${pkg} build failed (${elapsed}s)\x1b[0m`);
                if (stderr) console.error(stderr.trim());
            }
            building.delete(pkg);
        });
    }

    return {
        name: "babylon-server",
        configureServer(server) {
            // ---------------------------------------------------------------
            // Source file watcher — rebuild UMD packages on source change
            // ---------------------------------------------------------------
            if (enableWatch) {
                // Debounce map: pkg → timer
                const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
                const DEBOUNCE_MS = 300;

                // Create a dedicated chokidar watcher for source directories.
                // Using a separate instance (not server.watcher) because Vite's
                // watcher is scoped to the server root and doesn't reliably
                // pick up changes in external directories.
                const srcDirs = sourceToPackage.map((s) => s.srcDir);
                const srcWatcher = chokidarWatch(srcDirs, {
                    ignoreInitial: true,
                    ignored: ["**/node_modules/**", "**/.git/**"],
                });

                srcWatcher.on("change", (file) => {
                    const packages = sourceToPackage.flatMap((s) => (file.startsWith(s.srcDir) ? s.packages : []));
                    if (!packages.length) return;

                    console.log(`\x1b[90m  changed: ${path.relative(REPO_ROOT, file)}\x1b[0m`);

                    for (const pkg of new Set(packages)) {
                        const existing = debounceTimers.get(pkg);
                        if (existing) clearTimeout(existing);
                        debounceTimers.set(
                            pkg,
                            setTimeout(() => {
                                debounceTimers.delete(pkg);
                                rebuildPackage(pkg, server);
                            }, DEBOUNCE_MS)
                        );
                    }
                });

                // Clean up child processes and watcher when server closes
                const cleanup = () => {
                    srcWatcher.close();
                    for (const child of children) {
                        child.kill();
                    }
                    children.length = 0;
                };
                server.httpServer?.on("close", cleanup);
                process.on("SIGINT", () => {
                    cleanup();
                    process.exit(0);
                });
                process.on("SIGTERM", () => {
                    cleanup();
                    process.exit(0);
                });

                const watchedPackages = new Set(sourceToPackage.flatMap((s) => s.packages));
                console.log(`\x1b[36m👀 Watching source files for ${watchedPackages.size} packages (live reload: ${enableLiveReload ? "on" : "off"})\x1b[0m`);
            }

            // ---------------------------------------------------------------
            // Middleware — serves UMD bundles with request logging
            // ---------------------------------------------------------------
            const log = enableLog
                ? (status: number, url: string, source: string) => {
                      const color = status < 400 ? "\x1b[32m" : "\x1b[31m";
                      console.log(`${color}${status}\x1b[0m ${url} \x1b[90m(${source})\x1b[0m`);
                  }
                : () => {};

            /** Pipe a file to the response with error handling for TOCTOU races during rebuilds. */
            const sendFile = (filePath: string, res: import("http").ServerResponse) => {
                const stream = fs.createReadStream(filePath);
                stream.on("error", () => {
                    if (!res.headersSent) {
                        res.statusCode = 500;
                        res.end("File read error");
                    }
                });
                stream.pipe(res);
            };

            server.middlewares.use((req: Connect.IncomingMessage, res, next) => {
                const url = req.url?.split("?")[0]?.replace(/^\//, "") ?? "";

                // --- UMD bundle serving ---
                const umdEntry = getUmdEntry(url);
                if (umdEntry) {
                    const filePath = path.join(UMD_ROOT, umdEntry.dir, umdEntry.file);
                    if (fs.existsSync(filePath)) {
                        log(200, "/" + url, `umd/${umdEntry.dir}`);
                        res.setHeader("Content-Type", "application/javascript");
                        res.setHeader("Access-Control-Allow-Origin", "*");
                        sendFile(filePath, res);
                        return;
                    }
                    log(404, "/" + url, "umd missing");
                    res.statusCode = 404;
                    res.end("UMD bundle not found");
                    return;
                }

                // --- Sourcemap serving (same dir as the UMD bundle) ---
                if (url.endsWith(".js.map")) {
                    const jsUrl = url.replace(/\.map$/, "");
                    const jsEntry = getUmdEntry(jsUrl);
                    if (jsEntry) {
                        // The map file may be named after the served file (e.g. babylon.max.js.map)
                        // OR after the original rollup output (e.g. babylon.js.map / babylon.min.js.map),
                        // depending on whether copyMinToMaxPlugin ran for this entry.  Try both.
                        const candidates = [
                            jsEntry.file + ".map",
                            jsEntry.file.replace(/\.max\.js$/, ".js") + ".map",
                            jsEntry.file.replace(/\.js$/, ".min.js") + ".map",
                            jsEntry.file.replace(/\.min\.js$/, ".js") + ".map",
                        ];
                        for (const candidate of candidates) {
                            const mapPath = path.join(UMD_ROOT, jsEntry.dir, candidate);
                            if (fs.existsSync(mapPath)) {
                                log(200, "/" + url, "sourcemap");
                                res.setHeader("Content-Type", "application/json");
                                res.setHeader("Access-Control-Allow-Origin", "*");
                                sendFile(mapPath, res);
                                return;
                            }
                        }
                        // No sourcemap exists for this UMD bundle.  Return 404 with an
                        // empty JSON body so DevTools doesn't try to parse Vite's SPA
                        // fallback HTML as JSON (which is the source of "Unexpected
                        // token '<'" warnings in the browser console).
                        log(404, "/" + url, "sourcemap missing");
                        res.statusCode = 404;
                        res.setHeader("Content-Type", "application/json");
                        res.setHeader("Access-Control-Allow-Origin", "*");
                        res.end("{}");
                        return;
                    }
                }

                // --- CSS serving (companion .css files from rollup postcss) ---
                if (url.endsWith(".css")) {
                    const jsUrl = url.replace(/\.css$/, ".js");
                    const jsEntry = umdUrlMap[jsUrl];
                    if (jsEntry) {
                        const cssFile = jsEntry.file.replace(/\.js$/, ".css");
                        const cssPath = path.join(UMD_ROOT, jsEntry.dir, cssFile);
                        if (fs.existsSync(cssPath)) {
                            log(200, "/" + url, "umd css");
                            res.setHeader("Content-Type", "text/css");
                            res.setHeader("Access-Control-Allow-Origin", "*");
                            sendFile(cssPath, res);
                            return;
                        }
                    }
                }

                // --- Declaration file rewrites ---
                const dtsEntry = declarationRewrites[url];
                if (dtsEntry) {
                    const dtsPath = path.join(declarationsDir, dtsEntry);
                    if (fs.existsSync(dtsPath)) {
                        log(200, "/" + url, "declaration");
                        res.setHeader("Content-Type", "application/typescript");
                        res.setHeader("Access-Control-Allow-Origin", "*");
                        sendFile(dtsPath, res);
                        return;
                    }
                }

                const staticDtsPath = staticDeclarationRewrites[url];
                if (staticDtsPath && fs.existsSync(staticDtsPath)) {
                    log(200, "/" + url, "static declaration");
                    res.setHeader("Content-Type", "application/typescript");
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    sendFile(staticDtsPath, res);
                    return;
                }

                if (url.endsWith(".d.ts")) {
                    log(404, "/" + url, "declaration missing");
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "text/plain");
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    res.end("Declaration file not found");
                    return;
                }

                // --- Playground public files (e.g. index.js CDN loader) ---
                const decodedUrl = decodeURIComponent(url);
                const pgPath = path.resolve(playgroundPublic, decodedUrl);
                if (pgPath.startsWith(playgroundPublic + path.sep) && fs.existsSync(pgPath) && fs.statSync(pgPath).isFile()) {
                    const ext = path.extname(pgPath);
                    const mimeTypes: Record<string, string> = {
                        ".js": "application/javascript",
                        ".css": "text/css",
                        ".html": "text/html",
                        ".json": "application/json",
                        ".wasm": "application/wasm",
                        ".svg": "image/svg+xml",
                        ".png": "image/png",
                    };
                    res.setHeader("Content-Type", mimeTypes[ext] ?? "application/octet-stream");
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    log(200, "/" + url, "playground/public");
                    sendFile(pgPath, res);
                    return;
                }

                // CORS headers for all other requests
                res.setHeader("Access-Control-Allow-Origin", "*");
                next();
            });
        },
    };
}

// ---------------------------------------------------------------------------
// Main Vite configuration
// ---------------------------------------------------------------------------

export default defineConfig((_env) => {
    const cdnPort = getCdnPort();

    return {
        root: __dirname,

        plugins: [babylonServerPlugin()],

        // The public/ directory contains static assets (physics engines, wasm, etc.)
        publicDir: "public",

        server: {
            port: cdnPort,
            strictPort: true,
            https: process.env.ENABLE_HTTPS === "true" ? {} : undefined,
            // Allow network access
            host: "::",
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            fs: {
                // Allow serving from UMD output dirs and playground public
                allow: ["../../.."],
            },
        },

        // sceneTs.ts uses BABYLON as a global — tell esbuild not to error on it
        // by treating it as an external (the UMD bundles define it on window)
        optimizeDeps: {
            // Nothing to pre-bundle — the scene files use globals
            exclude: ["@tools/snippet-loader"],
        },

        build: {
            outDir: "dist",
            sourcemap: true,
            rollupOptions: {
                input: {
                    sceneTs: path.resolve(__dirname, "src/sceneTs.ts"),
                    sceneJs: path.resolve(__dirname, "src/sceneJs.js"),
                },
                output: {
                    entryFileNames: "[name].js",
                },
            },
        },

        resolve: {
            alias: {
                core: path.resolve(DEV_ROOT, "core/dist"),
                gui: path.resolve(DEV_ROOT, "gui/dist"),
                serializers: path.resolve(DEV_ROOT, "serializers/dist"),
                loaders: path.resolve(DEV_ROOT, "loaders/dist"),
                materials: path.resolve(DEV_ROOT, "materials/dist"),
                inspector: path.resolve(DEV_ROOT, "inspector/dist"),
                "shared-ui-components": path.resolve(DEV_ROOT, "sharedUiComponents/dist"),
                "post-processes": path.resolve(DEV_ROOT, "postProcesses/dist"),
                "procedural-textures": path.resolve(DEV_ROOT, "proceduralTextures/dist"),
                addons: path.resolve(DEV_ROOT, "addons/dist"),
            },
        },
    };
});
