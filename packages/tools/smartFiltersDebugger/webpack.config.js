const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

var SRC_DIR = path.resolve(__dirname, "./src");
var OUTPUT_DIR = path.resolve(__dirname, "./unpackedExtension");

var buildConfig = function (env) {
    var isProd = env.prod;
    return {
        context: __dirname,
        entry: {
            background: SRC_DIR + "/background.ts",
            editorLauncher: SRC_DIR + "/editorLauncher.ts"
        },
        performance: {
            maxEntrypointSize: 5120000,
            maxAssetSize: 5120000
        },
        output: {
            path: OUTPUT_DIR,
            publicPath: "/",
            filename: "scripts/[name].js",
            library: {      
                name: "[name]",      
                type: 'var'
            },
            devtoolModuleFilenameTemplate: isProd ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
        devtool: isProd ? false : "inline-source-map",
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".scss", ".svg"],
            alias: {
                // "core": path.resolve("node_modules/@babylonjs/core"),
                // "shared-ui-components": path.resolve("node_modules/@dev/shared-ui-components"),
                // TODO. React not understood as a module
                react: path.resolve("../../node_modules/react"),
                "react-dom": path.resolve("../../node_modules/react-dom"),
            },
        },
        plugins: [
            new CopyPlugin({
              patterns: [
                { from: "./src/assets/manifest.json", to: "./manifest.json" },
                { from: "./src/assets/icons", to: "./icons" },
              ],
            }),
          ],
        module: {
            rules: [
                {
                    test: /\.(png|svg|jpg|jpeg|gif|ttf)$/i,
                    type: "asset/inline",
                },
                {
                    test: /(?<!module)\.s[ac]ss$/i,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: true,
                                modules: "global",
                            },
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.module\.s[ac]ss$/i,
                    use: [
                        "style-loader",
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: true,
                                modules: true,
                            },
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                },
                {
                    test: /\.js$/,
                    enforce: "pre",
                    use: ["source-map-loader"],
                },
            ],
        },
        mode: isProd ? "production" : "development",
    };
};

module.exports = buildConfig;
