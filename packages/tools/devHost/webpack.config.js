const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackTools = require("@dev/build-tools").webpackTools;
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TerserPlugin = require("terser-webpack-plugin");

const outputDirectoryForAliases = "src";
const buildTools = require("@dev/build-tools");
const externalsFunction = buildTools.webpackTools.externalsFunction;
const rules = buildTools.webpackTools.getRules({
    includeAssets: true,
    includeCSS: true,
    sideEffects: true,
    tsOptions: {
        transpileOnly: true,
        compilerOptions: {
            declaration: false,
        },
    },
});

module.exports = (env) => {
    const source = env.source || process.env.SOURCE || "dev"; // || "lts";
    // Toggle for production-style optimizations (mode=production, minification, gzip). Set DEVHOST_PROD=true to enable.
    const enableProd = (env && (env.prod || env.production)) || process.env.DEVHOST_PROD === "true";
    const basePathForSources = path.resolve(__dirname, "../../", source);
    const basePathForTools = path.resolve(__dirname, "../../", "tools");
    const externals = externalsFunction([], "umd");
    rules.shift();
    rules.push({
        test: /\.tsx?$/,
        oneOf: [
            {
                loader: "ts-loader",
                options: {
                    transpileOnly: true,
                    configFile: "tsconfig.build.json",
                },
            },
        ],
        exclude: /node_modules/,
        sideEffects: true,
    });
    const baseDevConfig = buildTools.webpackTools.commonDevWebpackConfiguration(
        {
            ...env,
            outputFilename: "main.js",
            dirName: __dirname,
        },
        {
            static: ["public"],
            port: process.env.TOOLS_PORT || 1338,
            showBuildProgress: true,
        }
    );

    const commonConfig = {
        mode: enableProd ? "production" : "development",
        ...baseDevConfig,
        entry: {
            entry: "./src/index.ts",
        },
        devServer: {
            ...(baseDevConfig.devServer || {}),
            compress: !!enableProd, // Enable gzip only when production optimizations are on
        },
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
            alias: {
                core: path.resolve(basePathForSources, "core", outputDirectoryForAliases),
                gui: path.resolve(basePathForSources, "gui", outputDirectoryForAliases),
                serializers: path.resolve(basePathForSources, "serializers", outputDirectoryForAliases),
                loaders: path.resolve(basePathForSources, "loaders", outputDirectoryForAliases),
                materials: path.resolve(basePathForSources, "materials", outputDirectoryForAliases),
                "lottie-player": path.resolve(basePathForSources, "lottiePlayer", outputDirectoryForAliases),
                inspector: path.resolve(__dirname, "../../", "dev", "inspector", outputDirectoryForAliases),
                "shared-ui-components": path.resolve(__dirname, "../../", "dev", "sharedUiComponents", outputDirectoryForAliases),
                "post-processes": path.resolve(basePathForSources, "postProcesses", outputDirectoryForAliases),
                "procedural-textures": path.resolve(basePathForSources, "proceduralTextures", outputDirectoryForAliases),
                "node-editor": path.resolve(basePathForTools, "nodeEditor", outputDirectoryForAliases),
                "node-geometry-editor": path.resolve(basePathForTools, "nodeGeometryEditor", outputDirectoryForAliases),
                "node-render-graph-editor": path.resolve(basePathForTools, "nodeRenderGraphEditor", outputDirectoryForAliases),
                "node-particle-editor": path.resolve(basePathForTools, "nodeRParticleEditor", outputDirectoryForAliases),
                "gui-editor": path.resolve(basePathForTools, "guiEditor", outputDirectoryForAliases),
                accessibility: path.resolve(basePathForTools, "accessibility", outputDirectoryForAliases),
                "babylonjs-gltf2interface": path.resolve("./src", "babylon.glTF2Interface.ts"),
            },
            symlinks: false,
        },
        experiments: {
            outputModule: true,
        },
        performance: {
            hints: false,
        },
        module: {
            rules,
        },
        plugins: [
            ...(env.analyze
                ? [
                      new BundleAnalyzerPlugin({
                          analyzerMode: "static",
                          generateStatsFile: true,
                          defaultSizes: "stat",
                      }),
                  ]
                : []),
            new HtmlWebpackPlugin({
                inject: true,
                template: path.resolve("./public/index.html"),
                scriptLoading: "module",
            }),
        ],
        optimization: enableProd
            ? {
                  minimize: true,
                  minimizer: [
                      new TerserPlugin({
                          extractComments: false,
                          terserOptions: {
                              module: true,
                              mangle: true,
                              compress: {
                                  passes: 2,
                                  ecma: 2020,
                              },
                              format: {
                                  comments: false,
                              },
                          },
                      }),
                  ],
              }
            : undefined,
    };

    return commonConfig;
};
