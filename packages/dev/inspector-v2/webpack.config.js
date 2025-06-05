const path = require("path");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
    entry: "./test/app/index.tsx",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            targets: "defaults",
                            presets: [["@babel/preset-env"], ["@babel/preset-react"], ["@babel/preset-typescript"]],
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [new ReactRefreshWebpackPlugin()].filter(Boolean),
    devServer: {
        static: {
            directory: path.join(__dirname, "public"),
        },
        hot: true,
        compress: true,
        port: 9001,
        historyApiFallback: true,
    },
    mode: "development",
};
