// Gulp Tools
var gulp = require("gulp");
// var optimisejs = require("gulp-optimize-js");

// Import Gulp Tasks
require("./tasks/gulpTasks-libraries");
require("./tasks/gulpTasks-librariesES6");
require("./tasks/gulpTasks-viewerLibraries");
require("./tasks/gulpTasks-tsLint");
require("./tasks/gulpTasks-netlify");
require("./tasks/gulpTasks-whatsNew");
require("./tasks/gulpTasks-localRun");
require("./tasks/gulpTasks-watchLibraries");
require("./tasks/gulpTasks-watchCore");
require("./tasks/gulpTasks-typedoc");
require("./tasks/gulpTasks-intellisense");
require("./tasks/gulpTasks-tests");
require("./tasks/gulpTasks-remapPaths");

// Import Build Config
var config = require("../Config/config.json");

/**
 * Full TsLint.
 * Back Compat Only, now included in typescript-libraries-tsLint.
 */
gulp.task("tsLint", gulp.series("typescript-libraries-tsLint"));

/**
 * Build the releasable files.
 * Back Compat Only, now name core as it is a lib
 */
gulp.task("typescript", gulp.series("core"));

/**
 * Build all libs.
 */
gulp.task("typescript-libraries", gulp.series(config.modules, config.viewerModules));

/**
 * Build all es 6 libs.
 */
gulp.task("typescript-es6", gulp.series(config.modules.map((module) => module + "-es6")));

/**
 * Validate compile the code and check the comments and style case convention through typedoc
 */
gulp.task("typedoc-check", gulp.series("core", "gui", "loaders", "serializers", "typedoc-generate", "typedoc-validate"));

/**
 * Combine Webserver and Watch as long as vscode does not handle multi tasks.
 */
gulp.task("run", gulp.series("watchCore", "watchLibraries", "webserver"));

/**
 * Do it all (Build).
 */
gulp.task("typescript-all", gulp.series("typescript-libraries", "typescript-es6", "netlify-cleanup"));

/**
 * Do it all (tests).
 */
gulp.task("tests-all", gulp.series("tests-unit", "tests-modules", "tests-validation-virtualscreen", "tests-validation-browserstack"));

/**
 * The default task, concat and min the main BJS files.
 */
gulp.task("default", gulp.series("tsLint", "typescript-all", "intellisense", "typedoc-all", "tests-all"));
