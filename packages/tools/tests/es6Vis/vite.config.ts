import { defineConfig } from "vite";

const prebundleBabylonPackages = process.env.ES6VIS_PREBUNDLE === "true";

export default defineConfig({
    root: __dirname,

    resolve: {
        extensions: [".ts", ".js", ".mjs"],
    },

    server: {
        port: 1340,
        host: "::",
    },

    optimizeDeps: prebundleBabylonPackages
        ? {
              entries: ["src/bootstrap.ts", "src/scenes/*/*.ts"],
              include: ["@babylonjs/core", "@babylonjs/core/pure", "@babylonjs/gui", "@babylonjs/loaders"],
          }
        : {
              // Prevent Vite from pre-bundling the large @babylonjs packages.
              // They ship as native ESM and will be served directly.
              exclude: ["@babylonjs/core", "@babylonjs/gui", "@babylonjs/loaders"],
          },
});
