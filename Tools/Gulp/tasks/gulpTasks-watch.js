// Import Dependencies.
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var path = require("path");
var processShaders = require("../helpers/gulp-processShaders");
var uncommentShaders = require('../helpers/gulp-removeShaderComments');

// Read the full config.
var config = require("../config.json");

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watch", function startWatch() {
    var tasks = [];

    config.modules.map(function(module) {
        var settings = config[module].build;
        var isCore = config[module].isCore;
        if (settings && settings.webpack) {
            for (var index = 0; index < config[module].libraries.length; index++) {
                var library = config[module].libraries[index];
                if (library.preventLoadLibrary) { 
                    continue;
                }

                let wpConfig = require(settings.webpack);
                // watch on.
                wpConfig.watch = true;
                // dev mode and absolute path sourcemaps for debugging
                wpConfig.mode = "development";
                wpConfig.devtool = "nosources-source-map";

                var rootPath = path.resolve(__dirname, "../../../");
                var absoluteSrc = path.resolve(__dirname, "../", settings.srcDirectory);
                var prefix = isCore ? "../" : "../../";
                wpConfig.output.devtoolModuleFilenameTemplate = (info) => {
                    info.resourcePath = path.normalize(info.resourcePath);

                    if (!path.isAbsolute(info.resourcePath)) {
                        info.resourcePath = path.join(absoluteSrc, info.resourcePath);
                    }

                    return `${prefix}${path.relative(rootPath, info.resourcePath).replace(/\\/g, "/")}`;
                };

                var outputDirectory = config.build.tempDirectory + settings.distOutputDirectory;
                tasks.push(webpackStream(wpConfig, webpack).pipe(gulp.dest(outputDirectory)))

                tasks.push(gulp.src(settings.srcDirectory + "**/*.fx")
                    .pipe(uncommentShaders())
                    .pipe(processShaders(isCore))
                );

                tasks.push(
                    gulp.watch(settings.srcDirectory + "**/*.fx", { interval: 1000 }, function() {
                        console.log(library.output + ": Shaders.");
                        gulp.src(settings.srcDirectory + "**/*.fx")
                            .pipe(uncommentShaders())
                            .pipe(processShaders(isCore));
                    })
                );
            }
        }
    });

    return Promise.resolve();
});