// Import Dependencies.
var gulp = require("gulp");
var merge2 = require("merge2");
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
var config = require("../config.json");

/*
 * TsLint all typescript files from the src directory.
 */
gulp.task("typescript-tsLint", function() {
    const dtsFilter = filter(['**', '!**/*.d.ts', '!**/*.fragment.ts', '!**/*.vertex.ts', '!**/ShadersInclude/**'], { restore: false });
    return gulp.src(config.typescript)
        .pipe(dtsFilter)
        .pipe(gulpTslint(tsLintConfig))
        .pipe(gulpTslint.report());
});

/*
 * TsLint all typescript files from the src directory.
 */
var tsLintExternalLibrary = function(library, settings, watch) {
    const fxFilter = filter(['**', '!**/*.fragment.ts', '!**/*.vertex.ts', '!**/ShadersInclude/**'], { restore: false });
    return gulp.src((settings.build.srcDirectory) + "/**/*.ts")
        .pipe(fxFilter)
        .pipe(gulpTslint(tsLintConfig))
        .pipe(gulpTslint.report());
}

/**
 * Dynamic module linting for external library (mat, post processes, ...).
 */
config.modules.map(function(module) {
    // Task will be like moduleName-tsLint
    gulp.task(module + "-tsLint", function() {
        var settings = config[module];

        var tasks = settings.libraries.map(function(library) {
            return tsLintExternalLibrary(library, settings, false);
        });
    
        let mergedTasks = merge2(tasks);
        return mergedTasks;
    });
});

/**
 * Full Librairies tsLint.
 */
gulp.task("typescript-libraries-tsLint",
    gulp.series(config.modules.map((module) => {
        return module + "-tsLint";
    })
));

/**
 * Full TsLint.
 */
gulp.task("tsLint", gulp.series("typescript-tsLint", "typescript-libraries-tsLint"));
