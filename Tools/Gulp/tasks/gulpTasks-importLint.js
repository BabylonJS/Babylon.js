// Import Dependencies.
var gulp = require("gulp");
var filter = require('gulp-filter');

// Helpers.
var validateImports = require("../helpers/gulp-validateImports");
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var processShaders = require("../helpers/gulp-processShaders");

// Read the full config.
var config = require("../../Config/config.js");

/**
 * Create shader ts files.
 */
var buildShaders = function(settings) {
    return gulp.src(settings.computed.shaderGlob)
            .pipe(uncommentShaders())
            .pipe(processShaders(settings.isCore));
}

/*
 * ImportLint all typescript files from the src directory.
 */
var importLintLibrary = function(settings) {
    const fxFilter = filter(['**', '!**/*.fragment.ts', '!**/*.vertex.ts', '!**/*.compute.ts', '!**/ShadersInclude/**'], { restore: false });
    return gulp.src(settings.computed.tsGlob)
        .pipe(fxFilter)
        .pipe(validateImports({
            externals: settings.build.umd.processDeclaration.classMap,
            isCore: settings.isCore,
            uncheckedLintImports: settings.build.uncheckedLintImports
        }));
}

/**
 * Dynamic module linting for library (mat, post processes, ...).
 */
var lintLibrary = function(name, settings) {
    var tasks = [];

    var shaders = function() { return buildShaders(settings); };
    var lint = function() { return importLintLibrary(settings); };

    tasks.push(shaders, lint);

    tasks.map(t => t.displayName = name + "-importLint:" + t.name);
    return gulp.series(...tasks);
};

/**
 * Dynamic module linting for library (mat, post processes, ...).
 */
config.modules.map(function(module) {
    const settings = config[module];
    gulp.task(module + "-importLint", lintLibrary(module, settings));
});


/**
 * Full Libraries importLint.
 */
gulp.task("typescript-libraries-importLint",
    gulp.series(config.modules.map((module) => {
        return module + "-importLint";
    })
));
