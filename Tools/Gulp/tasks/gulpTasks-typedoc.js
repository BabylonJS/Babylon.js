// Import Dependencies.
var gulp = require("gulp");
var typedoc = require("gulp-typedoc");

// Import Tools.
var validateTypedoc = require("../helpers/gulp-validateTypedoc");

// Read the full config.
var config = require("../../Config/config.json");

/**
 * Generate the TypeDoc JSON output in order to create code metadata.
 */
gulp.task("typedoc-generate", function() {
    return gulp
        .src(config.build.typedocGenerationFiles)
        .pipe(typedoc({
            // TypeScript options (see typescript docs)
            mode: "modules",
            module: "commonjs",
            target: "es5",
            includeDeclarations: true,

            // Output options (see typedoc docs)
            json: config.build.typedocJSON,

            // TypeDoc options (see typedoc docs)
            ignoreCompilerErrors: true,

            readme: "none",

            excludeExternals: true,
            excludePrivate: true,
            excludeProtected: true,

            entryPoint: config.build.typedocEntryPoint
        }));
});

/**
 * Validate the TypeDoc JSON output against the current baselin to ensure our code is correctly documented.
 * (in the newly introduced areas)
 */
gulp.task("typedoc-validate", function() {
    return gulp.src(config.build.typedocJSON)
        .pipe(validateTypedoc(config.build.typedocValidationBaseline, "BABYLON", true, false));
});

/**
 * Generate the validation reference to ensure our code is correctly documented.
 */
gulp.task("typedoc-generateValidationBaseline", function() {
    return gulp.src(config.build.typedocJSON)
        .pipe(validateTypedoc(config.build.typedocValidationBaseline, "BABYLON", true, true));
});

/**
 * Validate the code comments and style case convention through typedoc and
 * generate the new baseline.
 */
gulp.task("typedoc-all", gulp.series("typedoc-generate", "typedoc-validate", "typedoc-generateValidationBaseline"));
