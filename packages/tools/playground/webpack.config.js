const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const path = require("path");

module.exports = (env) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const BUILD_ID = process.env.BUILD_BUILDID || process.env.BUILD_SOURCEVERSION || String(Date.now());
    // eslint-disable-next-line no-console
    console.log(`Building playground in ${production ? "production" : "development"} mode using build id: ${BUILD_ID}`);
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
                    languages: ["typescript", "javascript"],
                    filename: "[name].[contenthash].worker.js",
                    monacoEditorPath: path.resolve("../../../node_modules/monaco-editor"),
                }),
                // Override Monaco's defaultDocumentColorsComputer with a compatible version
                // that doesn't use negative lookbehind regex (unsupported in older Safari).
                // Using NormalModuleReplacementPlugin instead of resolve.alias to avoid
                // circular resolution loops that cause CI timeouts.
                new (require("webpack").NormalModuleReplacementPlugin)(
                    /defaultDocumentColorsComputer\.js$/,
                    path.resolve(__dirname, "src/tools/monaco/compat/defaultDocumentColorsComputer.ts")
                ),
            ]
        ),
        resolve: {
            extensions: [".js", ".ts", ".tsx", ".scss", "*.svg"],
            alias: {
                "shared-ui-components": path.resolve("../../dev/sharedUiComponents/dist"),
            },
        },
        externals: {
            "@dev/core": "BABYLON",
        },
        module: {
            rules: webpackTools.getRules({
                sideEffects: true,
                includeCSS: true,
                extraRules: [
                    {
                        test: /\.m?js$/,
                        include: /node_modules[\\/]+monaco-editor/,
                        use: {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: true,
                                compilerOptions: {
                                    allowJs: true,
                                    target: "ES2015",
                                    module: "ESNext",
                                },
                            },
                        },
                    },
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
            }),
        },
    };
    const plugins = (commonConfig.plugins || []).filter((p) => !(p && p.constructor && p.constructor.name === "ReactRefreshWebpackPlugin"));
    return {
        ...commonConfig,
        output: {
            ...(commonConfig.output || {}),
            filename: `babylon.playground.[fullhash].js`,
            chunkFilename: `[name].[fullhash].js`,
            assetModuleFilename: `assets/[name].[fullhash][ext]`,
            hashSalt: BUILD_ID,
            publicPath: commonConfig.output?.publicPath ?? "auto",
        },
        devServer: {
            ...(commonConfig.devServer || {}),
            client: {
                ...(commonConfig.devServer?.client || {}),
                overlay: false,
            },
        },
        plugins: [
            ...plugins,
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "debug.html"),
                filename: "debug.html",
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "frame.html"),
                filename: "frame.html",
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "full.html"),
                filename: "full.html",
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, "index.html"),
                templateParameters: (compilation) => ({
                    PLAYGROUND_BUNDLE: `babylon.playground.${compilation.hash}.js`,
                }),
                inject: false,
            }),
            !production && new ReactRefreshWebpackPlugin({ overlay: false }),
        ].filter(Boolean),
    };
};
