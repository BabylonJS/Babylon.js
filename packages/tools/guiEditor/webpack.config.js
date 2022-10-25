const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        mode: production ? "production" : "development",
        entry: "./src/legacy/legacy.ts",
        devtool: production ? "source-map" : "eval-cheap-module-source-map",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "babylon.guiEditor.js",
            devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".svg", "*.scss"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            },
        },
        externals: [
            function ({ _context, request }, callback) {
                if (/^core\//.test(request)) {
                    // Externalize to a commonjs module using the request path
                    return callback(null, "BABYLON");
                } else if (/^gui\//.test(request)) {
                    return callback(null, "BABYLON.GUI");
                }

                // Continue without externalizing the import
                callback();
            },
            // TODO add externals for production build vs. serve
            // React, react dom etc'
        ],
        module: {
            rules: webpackTools.getRules({
                includeCSS: true,
                includeAssets: true,
                sideEffects: true,
                tsOptions: {
                    compilerOptions: {
                        "rootDir": "../../",
                    }
                }
            }),
        },
        devServer: {
            static: {
                directory: path.join(__dirname, "public"),
                watch: false,
            },
            // hot: true,
            port: env.GUIEDITOR_PORT || 1341,
            server: env.enableHttps !== undefined || process.env.ENABLE_HTTPS === "true" ? "https" : "http",
            hot: (env.enableHotReload !== undefined || process.env.ENABLE_HOT_RELOAD === "true") && !production ? true : false,
            liveReload: (env.enableLiveReload !== undefined || process.env.ENABLE_LIVE_RELOAD === "true") && !production ? true : false,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        },
        plugins: [],
    };
    return commonConfig;
};
