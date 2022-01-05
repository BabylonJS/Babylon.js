// Import Dependencies.
var gulp = require("gulp");
var symlinkDir = require('symlink-dir')
var path = require('path')

// Import Build Config
var config = require("../../Config/config.js");

/**
 * Generate our required symlinked for the shared components.
 */
var generateSharedUiComponents = function(settings, done) {
    if (!settings.build.sharedUiComponents) {
        done();
        return;
    }

    var sharedUiComponents = config.computed.sharedUiComponentsSrcPath;
    var umdSharedUiComponents = path.resolve(settings.computed.mainDirectory, settings.build.sharedUiComponents);

    symlinkDir(sharedUiComponents, umdSharedUiComponents).then(() => {
        done();
    });
};

/**
 * Dynamic build SymLinks.
 */
function buildSymLinks(name, settings) {
    // Creates the required tasks.
    var tasks = [];

    var sharedUiComponents = function(cb) { return generateSharedUiComponents(settings, cb); };

    tasks.push(sharedUiComponents);

    tasks.map(t => t.displayName = name + "-symlinks:" + t.name);
    return gulp.series(...tasks);
}

/**
 * Dynamic symlinks creation.
 */
config.modules.map(function(module) {
    const settings = config[module];
    gulp.task(module + "-symlinks", buildSymLinks(module, settings));
});

/**
 * Build all symlinks.
 */
gulp.task("generate-symlinks", gulp.series(config.modules.map((module) => module + "-symlinks")));

