const path = require("path");
const webpackTools = require("@dev/build-tools").webpackTools;

module.exports = (env) => {
    const commonConfig = {
        entry: "./src/index.ts",
        ...webpackTools.commonDevWebpackConfiguration(
            {
                mode: env.mode,
            },
            {
                post: 1339,
                static: ["public"],
            }
        ),
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "babylon.viewer.assets.js",
            libraryTarget: "umd",
            library: {
                root: ["BabylonViewerAssets"],
            },
            umdNamedDefine: true,
            devtoolModuleFilenameTemplate: env.production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
        },
        resolve: {
            extensions: [".js", ".ts", ".tsx"],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    exclude: /node_modules/,
                    sideEffects: true,
                    options: {
                        configFile: "tsconfig.build.json",
                    },
                },
                {
                    sideEffects: true,
                    test: /\.js$/,
                    enforce: "pre",
                    use: ["source-map-loader"],
                },
                {
                    test: /\.(jpe?g|png|ttf|woff|eot|svg?)(\?[a-z0-9=&.]+)?$/,
                    type: "asset/inline",
                },
                {
                    test: /\.html$/i,
                    loader: "html-loader",
                    options: {
                        esModule: false,
                    },
                },
            ],
        },
        plugins: [],
    };
    return commonConfig;
};
