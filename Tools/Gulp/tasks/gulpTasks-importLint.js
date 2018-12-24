// Import Dependencies.
var gulp = require("gulp");
var filter = require('gulp-filter');

// Helpers
var validateImports = require("../helpers/gulp-validateImports");

// Read the full config.
var config = require("../../Config/config.js");

/*
 * ImportLint all typescript files from the src directory.
 */
var importLintLibrary = function(settings) {
    const fxFilter = filter(['**', '!**/*.fragment.ts', '!**/*.vertex.ts', '!**/ShadersInclude/**'], { restore: false });
    return gulp.src(settings.computed.tsGlob)
        .pipe(fxFilter)
        .pipe(validateImports({
            externals: settings.build.umd.processDeclaration.classMap
        }));
}

/**
 * Dynamic module linting for library (mat, post processes, ...).
 */
config.lintModules.map(function(module) {
    // Task will be like moduleName-importLint
    gulp.task(module + "-importLint", function() {
        var settings = config[module];

        return importLintLibrary(settings, false);
    });
});

/**
 * Full Librairies importLint.
 */
gulp.task("typescript-libraries-importLint",
    gulp.series(config.lintModules.map((module) => {
        return module + "-importLint";
    })
));
