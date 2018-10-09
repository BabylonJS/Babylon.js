// Import Dependencies.
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var debug = require("gulp-debug");

// Read the full config.
var config = require("../config.json");

/**
 * Watch ts files from typescript .
 * Hack into the cli :-)
 */
gulp.task("srcTscWatch", function() {
    // Reuse The TSC CLI from gulp to enable -w.
    process.argv[2] = "-w";
    process.argv[3] = "-p";
    process.argv[4] = "../../src/tsconfig.json";
    require("../../../node_modules/typescript/lib/tsc.js");
    return Promise.resolve();
});

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watch", gulp.series("srcTscWatch", function startWatch() {
    var tasks = [];

    config.modules.map(function(module) {
        if (config[module].build && config[module].build.webpack) {
            var library = config[module].libraries[0];
            if (library.noWatch) return;
            var outputDirectory = config.build.tempDirectory + config[module].build.distOutputDirectory;
            let wpconfig = require("../" + config[module].build.webpack);
            wpconfig.watch = true;
            // dev mode and absolute path sourcemaps for debugging
            wpconfig.mode = "development";
            wpconfig.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]";
            //config.stats = "minimal";
            tasks.push(webpackStream(wpconfig, webpack).pipe(gulp.dest(outputDirectory)))
        }
    });

    console.log(tasks.length);

    return Promise.resolve();
}));