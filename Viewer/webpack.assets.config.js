module.exports = {
    context: __dirname,
    entry: [
        __dirname + '/src/assets/index.ts'
    ],
    output: {
        libraryTarget: 'var',
        library: 'BabylonViewerAssets',
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts']
    },
    mode: "production",
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: {
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig-gulp.json'
                }
            },
            exclude: /node_modules/
        },
        {
            test: /\.(html)$/,
            use: {
                loader: 'html-loader',
                options: {
                    minimize: true
                }
            }
        },
        {
            test: /\.(jpe?g|png|ttf|eot|svg?)(\?[a-z0-9=&.]+)?$/,
            use: 'base64-image-loader?limit=1000&name=[name].[ext]'
        },
        {
            test: /\.(woff|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'base64-inline-loader?limit=1000&name=[name].[ext]'
        }]
    }
}