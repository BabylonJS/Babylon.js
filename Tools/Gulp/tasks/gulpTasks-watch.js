// Import Dependencies.
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
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
        if (settings && settings.webpack) {
            for (var index = 0; index < config[module].libraries.length; index++) {
                var library = config[module].libraries[index];
                if (library.preventLoadLibrary) { 
                    continue;
                }

                let wpconfig = require(settings.webpack);
                // watch on.
                wpconfig.watch = true;
                // dev mode and absolute path sourcemaps for debugging
                wpconfig.mode = "development";
                wpconfig.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]";
                //config.stats = "minimal";

                var outputDirectory = config.build.tempDirectory + settings.distOutputDirectory;
                tasks.push(webpackStream(wpconfig, webpack).pipe(gulp.dest(outputDirectory)))

                tasks.push(gulp.src(settings.srcDirectory + "**/*.fx")
                    .pipe(uncommentShaders())
                    .pipe(processShaders(config[module].isCore))
                );

                tasks.push(
                    gulp.watch(settings.srcDirectory + "**/*.fx", { interval: 1000 }, function() {
                        console.log(library.output + ": Shaders.");
                        gulp.src(settings.srcDirectory + "**/*.fx")
                            .pipe(uncommentShaders())
                            .pipe(processShaders(config[module].isCore));
                    })
                );
            }
        }
    });

    return Promise.resolve();
});