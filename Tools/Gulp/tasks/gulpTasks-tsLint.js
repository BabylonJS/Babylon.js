// Import Dependencies.
var gulp = require("gulp");
var merge2 = require("merge2");
var gulpTslint = require("gulp-tslint");
var minimist = require("minimist");

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
    return gulp.src(config.typescript)
        .pipe(gulpTslint(tsLintConfig))
        .pipe(gulpTslint.report());
});

/*
 * TsLint all typescript files from the src directory.
 */
var tsLintExternalLibrary = function(library, settings, watch) {
    if (library.files && library.files.length) {
        return gulp.src(library.files, { base: settings.build.srcOutputDirectory })
            .pipe(gulpTslint(tsLintConfig))
            .pipe(gulpTslint.report());
    }
    else {
        return gulp.src((settings.build.srcDirectory || settings.build.srcOutputDirectory) + "/**/*.ts")
            .pipe(gulpTslint(tsLintConfig))
            .pipe(gulpTslint.report());
    }
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
