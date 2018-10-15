// Gulp Tools
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var fs = require("fs");
var dtsBundle = require('dts-bundle');
var merge2 = require("merge2");
var path = require("path");

// Gulp Helpers
var processDeclaration = require('../helpers/gulp-processTypescriptDeclaration');
var rmDir = require("../helpers/gulp-rmDir");

// Import Build Config
var config = require("../config.json");

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
    wpConfig.output.filename = wpConfig.output.filename.replace(".min", "");
    let wpBuildMax = webpackStream(wpConfig, webpack);
    let buildEventMax = wpBuildMax.pipe(gulp.dest(outputDirectory));
    sequence.push(buildEventMax);

    var minAndMax = merge2(sequence);

    // TODO. Generate all d.ts
    if (!library.preventLoadLibrary) {
        minAndMax.on("end", function() {
            dtsBundle.bundle(settings.build.dtsBundle);

            let fileLocation = path.join(outputDirectory, settings.build.processDeclaration.filename);
            processDeclaration(fileLocation, settings.build.processDeclaration);

            cb();
        });
    }

    return minAndMax;
}

/**
 * Dynamic module creation In Serie for WebPack leaks.
 */
function buildExternalLibraries(settings) {
    var tasks = settings.libraries.map(function(library) {
        var build = function(cb) {
            return buildExternalLibrary(library, settings, cb);
        }
        return build;
    });

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic module creation.
 */
config.modules.map(function(module) {
    var settings = config[module];

    // Clean up old build files.
    rmDir(settings.build.dtsBundle.baseDir);

    // Build the libraries.
    gulp.task(module, buildExternalLibraries(settings));
});