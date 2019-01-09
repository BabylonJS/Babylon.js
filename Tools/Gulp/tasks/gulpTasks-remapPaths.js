// Gulp Tools
var gulp = require("gulp");
var minimist = require("minimist");

// Helpers
var remapPaths = require("../helpers/gulp-remapPaths");

// Parse Command Line.
var commandLineOptions = minimist(process.argv.slice(2), {
    string: ["path"]
});

/**
 * This tasks remaps all the import path of a typescript project to their relative paths.
 */
gulp.task("remapPaths", function() {
    const path = commandLineOptions.path;

    return gulp.src(path + "/**/*.ts", { base: path })
        .pipe(remapPaths({ basePath: path }))
        .pipe(gulp.dest(path));
});