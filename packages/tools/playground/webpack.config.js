const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");
const fs = require("fs");
const cp = require("child_process");

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";

    const aliasDist = {
        "shared-ui-components": path.resolve(__dirname, "../../dev/sharedUiComponents/dist"),
        "inspector-v2": path.resolve(__dirname, "../../dev/inspector-v2/dist"),
        addons: path.resolve(__dirname, "../../dev/addons/dist"),
        materials: path.resolve(__dirname, "../../dev/materials/dist"),
        core: path.resolve(__dirname, "../../dev/core/dist"),
        loaders: path.resolve(__dirname, "../../dev/loaders/dist"),
        gui: path.resolve(__dirname, "../../dev/gui/dist"),
        serializers: path.resolve(__dirname, "../../dev/serializers/dist"),
    };

    ensureBuiltIfMissingDist(aliasDist, { production });

    const commonConfig = {
        entry: "./src/legacy/legacy.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                ...env,
                outputFilename: "babylon.playground.js",
                dirName: __dirname,
                enableHotReload: true,
            },
            {
                static: ["public"],
                port: process.env.PLAYGROUND_PORT || 1338,
            },
            [
                new MonacoWebpackPlugin({
                    // publicPath: "public/",
                    languages: ["typescript", "javascript"],
                }),
            ]
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", ".svg"],
            alias: aliasDist,
        },
        externals: [
            function ({ context, request }, callback) {
                if (/^@dev\/core$/.test(request)) {
                    return callback(null, "BABYLON");
                }

                if (context.includes("inspector-v2")) {
                    if (/^core\//.test(request)) {
                        return callback(null, "BABYLON");
                    } else if (/^loaders\//.test(request)) {
                        return callback(null, "BABYLON");
                    } else if (/^addons\//.test(request)) {
                        return callback(null, "ADDONS");
                    } else if (/^materials\//.test(request)) {
                        return callback(null, "BABYLON");
                    } else if (/^gui\//.test(request)) {
                        return callback(null, "BABYLON.GUI");
                    }
                }

                // Continue without externalizing the import
                callback();
            },
        ],
        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: true,
                extraRules: [
                    {
                        test: /\.ttf$/,
                        type: "asset/resource",
                    },
                    {
                        test: /\.svg$/,
                        use: ["@svgr/webpack"],
                    },
                ],
                tsOptions: {
                    compilerOptions: {
                        rootDir: "../../",
                    },
                },
                enableFastRefresh: !production,
            }),
        },
    };
    return commonConfig;
};

function ensureBuiltIfMissingDist(aliasMap, { production }) {
    if (!production) {
        return;
    }

    const repoRoot = path.resolve(__dirname, "../../..");
    for (const [aliasKey, distPath] of Object.entries(aliasMap)) {
        const aliasName = aliasKey === "shared-ui-components" ? "sharedUiComponents" : aliasKey;
        const pkgDir = distPath.replace(/[\\/]dist$/, "");
        const exists = fs.existsSync(distPath);
        if (exists) {
            continue;
        }

        let workspaceName = null;
        try {
            const pkgJson = require(path.join(pkgDir, "package.json"));
            workspaceName = pkgJson.name;
        } catch (_) {
            /* ignore */
        }

        const cmd = workspaceName ? `npm run build -w "${workspaceName}"` : `npm run build`;

        cp.execSync(cmd, {
            cwd: workspaceName ? repoRoot : pkgDir,
            stdio: "inherit",
            env: process.env,
        });

        if (!fs.existsSync(distPath)) {
            throw new Error(`[prebuild] ${aliasName}: build finished but ${distPath} still missing.`);
        }
    }
}
