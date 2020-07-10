// Import Dependencies.
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var path = require("path");

// Read the full config.
var config = require("../../Config/config.js");

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watchApps", function startWatch() {
    var tasks = [];

    config.apps.map(function(module) {
        // Convert Module to Namespace for globals
        var settings = config[module].computed;

        if (settings) {
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

            var outputDirectory = settings.distDirectory;
            tasks.push(
                webpackStream({ config: wpConfig }, webpack)
                    .pipe(gulp.dest(outputDirectory))
            );
        }
    });

    return Promise.resolve();
});