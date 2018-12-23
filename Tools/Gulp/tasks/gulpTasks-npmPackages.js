// Import Dependencies.
var gulp = require("gulp");

// Read the full config.
var publish = require("../../Publisher/tasks/main");

/**
 * Generate local npm packages for npm link tests.
 */
gulp.task("npmPackages-generate", function(cb) {
    publish(false);
    cb();
});