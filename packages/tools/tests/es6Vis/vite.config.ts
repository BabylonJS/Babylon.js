import { defineConfig } from "vite";

export default defineConfig({
    root: __dirname,

    resolve: {
        extensions: [".ts", ".js", ".mjs"],
    },

    server: {
        port: 1340,
        host: "::",
    },

    // Prevent Vite from pre-bundling the large @babylonjs packages.
    // They ship as native ESM and will be served directly.
    optimizeDeps: {
        exclude: ["@babylonjs/core", "@babylonjs/gui", "@babylonjs/loaders"],
    },
});
