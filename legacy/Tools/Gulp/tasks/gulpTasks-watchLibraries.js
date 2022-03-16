// Import Dependencies.
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var path = require("path");
var processShaders = require("../helpers/gulp-processShaders");
var uncommentShaders = require('../helpers/gulp-removeShaderComments');

// Read the full config.
var config = require("../../Config/config.js");

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watchLibraries", function startWatch() {
    var tasks = [];

    config.modules.map(function(module) {
        var settings = config[module].computed;
        if (!config[module].isCore && settings) {
            for (var index = 0; index < config[module].libraries.length; index++) {
                var library = config[module].libraries[index];
                if (library.preventLoadLibrary) { 
                    continue;
                }

                var wpConfig = require(settings.webpackConfigPath);

                // watch on.
                wpConfig.watch = true;
                // dev mode and absolute path sourcemaps for debugging
                wpConfig.mode = "development";
                wpConfig.devtool = "nosources-source-map";

                // Source Map Remapping for dev tools.
                wpConfig.output.devtoolModuleFilenameTemplate = (info) => {
                    info.resourcePath = path.normalize(info.resourcePath);

                    if (!path.isAbsolute(info.resourcePath)) {
                        info.resourcePath = path.join(settings.srcDirectory, info.resourcePath);
                    }

                    return `../../../${path.relative(config.computed.rootFolder, info.resourcePath).replace(/\\/g, "/")}`;
                };

                tasks.push(
                    gulp.src(settings.shaderGlob)
                        .pipe(uncommentShaders())
                        .pipe(processShaders(false))
                );

                var outputDirectory = settings.localDevUMDDirectory;
                tasks.push(
                    webpackStream(wpConfig, webpack)
                        .pipe(gulp.dest(outputDirectory))
                );

                var watch = gulp.watch(settings.shaderGlob, { interval: 1000 }, function() {
                    console.log(library.output + ": Shaders.");
                })
                watch.on("add", (event) => {
                    return gulp.src(event)
                        .pipe(uncommentShaders())
                        .pipe(processShaders(false));
                });
                watch.on("change", (event) => {
                    return gulp.src(event)
                        .pipe(uncommentShaders())
                        .pipe(processShaders(false));
                });

                tasks.push(watch);
            }
        }
    });

    return Promise.resolve();
});