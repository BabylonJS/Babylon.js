// Import Dependencies.
var gulp = require("gulp");

// Read the full config.
var publish = require("../../Publisher/tasks/main");

/**
 * Get Ready to test Npm Packages.
 */
gulp.task("npmPackages-es6", gulp.series("typescript-es6", function(cb) {
    publish(false, {
        es6: true
    });
    cb();
}));

/**
 * Get Ready to test Npm Packages.
 */
gulp.task("npmPackages-UMD", gulp.series("typescript-libraries", function(cb) {
    publish(false, {
        umd: true
    });
    cb();
}));

/**
 * Get Ready to test Npm Packages.
 */
gulp.task("npmPackages-all", gulp.series("typescript-libraries", "typescript-es6", function(cb) {
    publish(false);
    cb();
}));
