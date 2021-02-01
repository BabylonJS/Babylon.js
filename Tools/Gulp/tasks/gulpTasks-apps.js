// Gulp Tools
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var path = require("path");

// Import Build Config
var config = require("../../Config/config.js");

/**
 * Build a single app
 */
var buildApp = function(settings, isMin) {
    // Convert Module to Namespace for globals
    var outputDirectory = settings.computed.distDirectory;

    // Webpack Config.
    var wpConfig = require(settings.computed.webpackConfigPath);

    // Create output by type (min vs max).
    if (isMin) {
        delete wpConfig.devtool;
    }
    else {
        // Map Output
        wpConfig.devtool = "source-map";
        wpConfig.output.devtoolModuleFilenameTemplate = (info) => {
            info.resourcePath = path.normalize(info.resourcePath);

            if (!path.isAbsolute(info.resourcePath)) {
                info.resourcePath = path.join(settings.computed.srcDirectory, info.resourcePath);
            }

            return `webpack://BABYLONJS/${path.relative(config.computed.rootFolder, info.resourcePath).replace(/\\/g, "/")}`;
        };

        // Generate unminified file.
        wpConfig.mode = "development";
    }

    // Generate minified file.
    let wpBuild = webpackStream({ config: wpConfig }, webpack);
    return wpBuild.pipe(gulp.dest(outputDirectory));
}

/**
 * Dynamic app creation In Serie for WebPack leaks.
 */
function buildAppLibraries(settings) {
    // Creates the required tasks.
    var tasks = [];

    var buildMin = function() { return buildApp(settings, true) };

    tasks.push(buildMin);

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic app creation.
 */
config.apps.map(function(app) {
    const settings = config[app];
    gulp.task(app, buildAppLibraries(settings));
});

/**
 * Build all libs.
 */
gulp.task("typescript-apps", gulp.series(config.apps));