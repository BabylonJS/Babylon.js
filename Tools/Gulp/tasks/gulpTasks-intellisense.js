// Import Dependencies.
var gulp = require("gulp");
var concat = require("gulp-concat");
var replace = require("gulp-replace");

// Read the full config.
var config = require("../../Config/config.json");

/**
 * Process the .d.ts files or Playground intellisense.
 */
gulp.task("intellisense", function() {
    return gulp.src(config.build.intellisenseSources)
        .pipe(concat(config.build.intellisenseFile))
        .pipe(replace(/^\s*readonly _/gm, "protected readonly _"))
        .pipe(replace(/^\s*static _/gm, "private static _"))
        .pipe(replace(/^\s*class _/gm, "private class _"))
        .pipe(replace(/^\s* _/gm, "private _"))
        .pipe(replace(/^\s*_/gm, "private _"))
        .pipe(gulp.dest(config.build.playgroundDirectory));
});