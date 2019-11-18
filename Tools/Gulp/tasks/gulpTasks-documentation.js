// Import Dependencies.
var gulp = require("gulp");
var concat = require("gulp-concat");
var replace = require("gulp-replace");

// Read the full config.
var config = require("../../Config/config.json");

gulp.task("documentation", function() {
    return gulp.src(config.build.intellisenseSources)
        .pipe(concat(config.build.documentationFile))
        .pipe(gulp.dest(config.build.outputDirectory));
});