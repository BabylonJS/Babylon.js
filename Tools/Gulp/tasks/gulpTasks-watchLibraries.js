// Import Dependencies.
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var path = require("path");
var processShaders = require("../helpers/gulp-processShaders");
var uncommentShaders = require('../helpers/gulp-removeShaderComments');

// Read the full config.
var configPath = "../config.json";
var config = require(configPath);

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watchLibraries", function startWatch() {
    var tasks = [];

    config.modules.map(function(module) {
        var settings = config[module].build;
        if (!config[module].isCore && settings) {
            for (var index = 0; index < config[module].libraries.length; index++) {
                var library = config[module].libraries[index];
                if (library.preventLoadLibrary) { 
                    continue;
                }

                var configFolder = path.dirname(path.resolve(__dirname, configPath));
                var wpConfigPath = path.join(settings.build.mainFolder, "webpack.config.js");
                var wpConfig = require(path.resolve(configFolder, wpConfigPath));

                // watch on.
                wpConfig.watch = true;
                // dev mode and absolute path sourcemaps for debugging
                wpConfig.mode = "development";
                wpConfig.devtool = "nosources-source-map";

                var rootPath = path.resolve(__dirname, "../../../");
                var absoluteSrc = path.resolve(__dirname, "../", settings.srcDirectory);
                wpConfig.output.devtoolModuleFilenameTemplate = (info) => {
                    info.resourcePath = path.normalize(info.resourcePath);

                    if (!path.isAbsolute(info.resourcePath)) {
                        info.resourcePath = path.join(absoluteSrc, info.resourcePath);
                    }

                    return `../../../${path.relative(rootPath, info.resourcePath).replace(/\\/g, "/")}`;
                };

                tasks.push(
                    gulp.src(settings.srcDirectory + "**/*.fx")
                        .pipe(uncommentShaders())
                        .pipe(processShaders(false))
                );

                var outputDirectory = config.build.tempDirectory + config.build.localDevUMDFolderName + settings.distOutputDirectory;
                tasks.push(
                    webpackStream(wpConfig, webpack).pipe(gulp.dest(outputDirectory))
                );

                tasks.push(
                    gulp.watch(settings.srcDirectory + "**/*.fx", { interval: 1000 }, function() {
                        console.log(library.output + ": Shaders.");
                        return gulp.src(settings.srcDirectory + "**/*.fx")
                            .pipe(uncommentShaders())
                            .pipe(processShaders(false));
                    })
                );
            }
        }
    });

    return Promise.resolve();
});