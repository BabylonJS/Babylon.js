const babylonWebpackConfig = require('../Tools/WebpackPlugins/babylonWebpackConfig');

var config = babylonWebpackConfig({
    module: "inspector",
    resolve: {
        extensions: [".js", '.ts', ".tsx"],
        alias: {
            "re-resizable$": path.resolve(__dirname, '../node_modules/re-resizable/lib/index.es5.js')
        }
    },
    moduleRules: [
        {
            test: /\.scss$/,
            use: [
                // fallback to style-loader in development
                process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
                "css-loader",
                "sass-loader"
            ]
        }, 
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }],
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ]
});

module.exports = config;
