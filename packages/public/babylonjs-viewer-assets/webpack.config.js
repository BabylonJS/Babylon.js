const path = require("path");

module.exports = (env) => {
    const commonConfig = {
        mode: env.production ? "production" : "development",
        entry: "./src/index.ts",
        devtool: env.production ? "source-map" : "eval-cheap-module-source-map",
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
        devServer: {
            static: {
                directory: path.join(__dirname, "public"),
                watch: false,
            },
            hot: false,
            port: 1339,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        },
        plugins: [],
    };
    return commonConfig;
};
