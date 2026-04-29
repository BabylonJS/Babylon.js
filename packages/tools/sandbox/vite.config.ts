import { defineConfig } from "vite";
import path from "path";
import { commonDevViteConfiguration, babylonDevExternalsPlugin } from "../../public/viteToolsHelper.mjs";

const base = commonDevViteConfiguration({
    port: parseInt(process.env.SANDBOX_PORT ?? "1339"),
    aliases: {
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
        core: path.resolve("../../dev/core/dist"),
        gui: path.resolve("../../dev/gui/dist"),
        loaders: path.resolve("../../dev/loaders/dist"),
        serializers: path.resolve("../../dev/serializers/dist"),
        materials: path.resolve("../../dev/materials/dist"),
        addons: path.resolve("../../dev/addons/dist"),
    },
    productionExternals: {
        babylonjs: "BABYLON",
        "babylonjs-gui": "BABYLON.GUI",
        "babylonjs-loaders": "BABYLON",
        "babylonjs-serializers": "BABYLON",
        "babylonjs-materials": "BABYLON",
        "babylonjs-addons": "ADDONS",
    },
});

export default defineConfig({
    ...base,
    plugins: [
        ...(base.plugins ?? []),
        // Rewrite dev-package imports (core/*, gui/*, …) to globalThis.BABYLON accesses
        // during production builds. In dev mode the resolve.alias entries handle resolution;
        // in build mode this plugin (enforce: "pre") rewrites the imports before Rollup
        // resolves them through aliases, keeping the bundle small and deferring to CDN UMDs.
        {
            ...babylonDevExternalsPlugin({
                core: "BABYLON",
                gui: "BABYLON.GUI",
                loaders: "BABYLON",
                serializers: "BABYLON",
                materials: "BABYLON",
                addons: "ADDONS",
            }),
            apply: "build" as const,
        },
        {
            // Generates `babylon.sandbox.js` at build time.
            //
            // The production HTML (public/index.html) uses a CDN bootstrap that
            // loads `babylon.sandbox.js` then calls BABYLON.Sandbox.Show().
            // In the webpack era this file was the compiled bundle. With Vite the
            // bundle is ES modules in assets/. This plugin generates a shim that:
            //   1. Injects <style> tags with inlined CSS and a <script type="module">
            //      tag for the Vite-built entry chunk (with correct hashed filename).
            //   2. Registers a BABYLON.Sandbox.Show stub that captures args and
            //      dispatches an event picked up by main.ts.
            //
            // CSS is inlined as <style> (not loaded via <link>) so it is applied
            // synchronously — matching the old webpack style-loader behavior and
            // preventing Playwright screenshots from capturing an unstyled page.
            name: "generate-sandbox-shim",
            apply: "build" as const,
            generateBundle(_options, bundle) {
                const entryChunk = Object.values(bundle).find((c) => c.type === "chunk" && c.isEntry);
                const cssAssets = Object.values(bundle).filter((a) => a.type === "asset" && a.fileName.endsWith(".css"));

                const moduleSrc = entryChunk ? `./${entryChunk.fileName}` : "./assets/index.js";
                // Inline CSS content into <style> tags so styles are applied synchronously.
                const cssInjections = cssAssets
                    .map((a) => {
                        const cssContent = "source" in a ? String(a.source) : "";
                        // Escape backticks and backslashes for template literal safety
                        const escaped = cssContent.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
                        return `var st=document.createElement("style");st.textContent=\`${escaped}\`;document.head.appendChild(st);`;
                    })
                    .join("\n    ");

                const shimCode = `(function () {
    // Inject Vite-built CSS inline (synchronous — no FOUC)
    ${cssInjections}
    // Load Vite-built ES module entry
    var s = document.createElement("script");
    s.type = "module";
    s.crossOrigin = "";
    s.src = "${moduleSrc}";
    document.head.appendChild(s);
    // Register BABYLON.Sandbox.Show shim for the CDN bootstrap (index.js)
    var B = window.BABYLON || (window.BABYLON = {});
    B.Sandbox = {
        Show: function (hostElement, versionInfo) {
            var args = [hostElement, versionInfo];
            window.__viteSandboxArgs = args;
            window.dispatchEvent(new CustomEvent("babylonSandboxReady", { detail: { args: args } }));
        },
    };
})();
`;
                this.emitFile({ type: "asset", fileName: "babylon.sandbox.js", source: shimCode });
            },
        },
    ],
});
