// Import Dependencies.
var gulp = require("gulp");
var typedoc = require("gulp-typedoc");

// Import Tools.
var validateTypedoc = require("../helpers/gulp-validateTypedoc");

// Read the full config.
var config = require("../config.json");

/**
 * Generate the TypeDoc JSON output in order to create code metadata.
 */
gulp.task("typedoc-generate", function() {
    return gulp
        .src([
            "../../dist/preview release/babylon.d.ts",
            "../../dist/preview release/gui/babylon.gui.d.ts",
            "../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts",
            "../../dist/preview release/loaders/babylonjs.loaders.d.ts",
            "../../dist/preview release/serializers/babylonjs.serializers.d.ts"])
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

            entryPoint: ["\"babylon.d\"", "BABYLON"]
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
