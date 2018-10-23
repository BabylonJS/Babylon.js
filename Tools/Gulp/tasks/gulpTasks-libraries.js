// Gulp Tools
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var dtsBundle = require('dts-bundle');
var merge2 = require("merge2");
var path = require("path");

// Gulp Helpers
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var processShaders = require("../helpers/gulp-processShaders");
var processDeclaration = require('../helpers/gulp-processTypescriptDeclaration');
var rmDir = require("../helpers/gulp-rmDir");

// Import Build Config
var config = require("../config.json");

/**
 * Create shader ts files.
 */
var buildShaders = function(settings) {
    return gulp.src(settings.build.srcDirectory + "**/*.fx")
            .pipe(uncommentShaders())
            .pipe(processShaders());
}

/**
 * Build a single library (one of the material of mat lib) from a module (materialsLibrary for instance)
 */
var buildExternalLibrary = function(library, settings, cb) {
    const sequence = [];
    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

    // Webpack Config.
    var wpConfig = require(settings.build.webpack);
    wpConfig.entry = {
        'main': path.resolve(wpConfig.context, library.entry),
    };
    wpConfig.output.filename = library.output;

    // Generate minified file.
    let wpBuildMin = webpackStream(wpConfig, webpack);
    let buildEventMin = wpBuildMin.pipe(gulp.dest(outputDirectory));
    sequence.push(buildEventMin);

    // Generate unminified file.
    wpConfig.mode = "development";
    // Allow babylon.max.js and babylon.js
    wpConfig.output.filename = library.maxOutput || wpConfig.output.filename.replace(".min", "");
    let wpBuildMax = webpackStream(wpConfig, webpack);
    let buildEventMax = wpBuildMax.pipe(gulp.dest(outputDirectory));
    sequence.push(buildEventMax);

    return merge2(sequence)
        .on("end", function() {
            // TODO. Generate all d.ts
            if (!library.preventLoadLibrary) {
                dtsBundle.bundle(settings.build.dtsBundle);

                let fileLocation = path.join(outputDirectory, settings.build.processDeclaration.filename);
                processDeclaration(fileLocation, settings.build.processDeclaration);
            }
            cb();
        });
}

/**
 * Dynamic module creation In Serie for WebPack leaks.
 */
function buildExternalLibraries(settings) {
    // Clean up old build files.
    rmDir(settings.build.dtsBundle.baseDir);

    // Creates the required tasks.
    var tasks = [];
    for (let library of settings.libraries) {
        var shaders = function() { return buildShaders(settings); };
        var build = function(cb) { return buildExternalLibrary(library, settings, cb) };

        tasks.push(shaders, build);
    }

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic module creation.
 */
config.modules.map(function(module) {
    const settings = config[module];
    gulp.task(module, buildExternalLibraries(settings));
});