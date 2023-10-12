const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration({
            mode: env.mode,
            outputFilename: "babylon.vsm.js",
            dirName: __dirname,
        }),
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
                        rootDir: "../../",
                    },
                },
            }),
        },
        devServer: {
            client: {
                overlay: process.env.DISABLE_DEV_OVERLAY
                    ? false
                    : {
                          warnings: false,
                          errors: true,
                      },
            },
            static: {
                directory: path.join(__dirname, "public"),
                watch: false,
            },
            // hot: true,
            port: env.VSM_PORT || 1342,
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
