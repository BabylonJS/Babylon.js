module.exports = {
    //context: __dirname,
    entry: [
        __dirname + '/src/index.ts'
    ]
    ,
    output: {
        libraryTarget: 'var',
        library: 'BabylonViewer',
        umdNamedDefine: true
    },
    externals: {
        cannon: 'CANNON',
        oimo: 'OIMO',
        vertx: true,
        "./Oimo": "OIMO",
        "earcut": true
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            "babylonjs": __dirname + '/../dist/preview release/babylon.max.js',
            "babylonjs-materials": __dirname + '/../dist/preview release/materialsLibrary/babylonjs.materials.js',
            "babylonjs-loaders": __dirname + '/../dist/preview release/loaders/babylonjs.loaders.js',
            // "es6-promise": __dirname + '/assets/es6-promise.min.js',
            "deepmerge": __dirname + '/assets/deepmerge.min.js',
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