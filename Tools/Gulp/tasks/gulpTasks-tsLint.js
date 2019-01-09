// Import Dependencies.
var gulp = require("gulp");
var gulpTslint = require("gulp-tslint");
var minimist = require("minimist");
var filter = require('gulp-filter');

// Parse Command Line.
var commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["tsLintFix"]
});

// Define Constants
var tsLintConfig = {
    formatter: "stylish",
    configuration: "../../tslint.json",
    fix: commandLineOptions.tsLintFix
}

// Read the full config.
var config = require("../../Config/config.js");

/*
 * TsLint all typescript files from the src directory.
 */
var tsLintExternalLibrary = function(settings) {
    const fxFilter = filter(['**', '!**/*.fragment.ts', '!**/*.vertex.ts', '!**/ShadersInclude/**'], { restore: false });
    return gulp.src(settings.computed.tsGlob)
        .pipe(fxFilter)
        .pipe(gulpTslint(tsLintConfig))
        .pipe(gulpTslint.report());
}

/**
 * Dynamic module linting for external library (mat, post processes, ...).
 */
config.lintModules.map(function(module) {
    // Task will be like moduleName-tsLint
    gulp.task(module + "-tsLint", function() {
        var settings = config[module];

        return tsLintExternalLibrary(settings, false);
    });
});

/**
 * Full Librairies tsLint.
 */
gulp.task("typescript-libraries-tsLint",
    gulp.series(config.lintModules.map((module) => {
        return module + "-tsLint";
    })
));
