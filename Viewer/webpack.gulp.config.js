module.exports = {
    context: __dirname,
    entry: [
        './src/index.ts'
    ]
    ,
    output: {
        libraryTarget: 'var',
        library: 'BabylonViewer',
        umdNamedDefine: true
    },
    externals: {
        cannon: true,
        //babylonjs: 'BABYLON'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            babylonjs: __dirname + '/../dist/preview release/babylon.max.js',
            "babylonjs-materials": __dirname + '/../dist/preview release/materialsLibrary/babylonjs.materials.js',
            "babylonjs-loaders": __dirname + '/../dist/preview release/loaders/babylonjs.loaders.js'
        }
    },
    module: {
        loaders: [{
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
            test: /\.(jpe?g|png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
            use: 'base64-image-loader?limit=1000&name=[name].[ext]'
        }]
    }
}