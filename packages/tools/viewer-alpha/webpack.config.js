const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    env = env || {};
    const source = env.source || "dev";
    return {
        // Define the mode as development
        mode: "development",

        // Entry point of your application
        entry: "./src/index.ts",

        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
            },
            {
                static: ["public"],
                port: process.env.VIEWER_PORT || 1339,
            }
        ),

        // Output configuration
        output: {
            filename: "webtest.js",
            path: path.resolve(__dirname, "dist"),
        },

        resolve: {
            extensions: [".ts", ".js"],
            alias: {
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
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
