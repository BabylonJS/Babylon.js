const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

// Make sure to run:
// npm run build -w babylonjs-viewer-assets -- --watch
// to watch assets (if needed)

module.exports = (env) => {
    env = env || {};
    const source = env.source || "dev";
    const production = env.mode === "production";
    return {
        entry: {
            viewer: "./src/index.ts",
            renderOnlyViewer: "./src/renderOnlyIndex.ts",
        },
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
            },
            {
                static: ["public"],
                port: process.env.VIEWER_PORT || 1338,
            }
        ),
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js",
            library: "BabylonViewer",
            devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
        resolve: {
            extensions: [".js", ".ts"],
            alias: {
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
                handlebars: "handlebars/dist/handlebars.js",
                "babylonjs-viewer-assets": path.resolve(__dirname, "../../public/babylonjs-viewer-assets/dist/babylon.viewer.assets.js"),
            },
            symlinks: false,
        },
        externals: {
            fs: true,
        },
        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: true,
            }),
        },
        ignoreWarnings: [/Failed to parse source map/],
    };
};
