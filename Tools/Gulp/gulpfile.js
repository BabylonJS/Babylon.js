// Gulp Tools
var gulp = require("gulp");

// Import Gulp Tasks
require("./tasks/gulpTasks-viewerLibraries");
require("./tasks/gulpTasks-libraries");
require("./tasks/gulpTasks-librariesES6");
require("./tasks/gulpTasks-tsLint");
require("./tasks/gulpTasks-importLint");
require("./tasks/gulpTasks-netlify");
require("./tasks/gulpTasks-whatsNew");
require("./tasks/gulpTasks-localRun");
require("./tasks/gulpTasks-watchLibraries");
require("./tasks/gulpTasks-watchCore");
require("./tasks/gulpTasks-typedoc");
require("./tasks/gulpTasks-intellisense");
require("./tasks/gulpTasks-tests");
require("./tasks/gulpTasks-remapPaths");
require("./tasks/gulpTasks-npmPackages");
require("./tasks/gulpTasks-dependencies");

/**
 * Full TsLint.
 */
gulp.task("tsLint", gulp.series("typescript-libraries-tsLint"));

/**
 * Full ImportLint.
 */
gulp.task("importLint", gulp.series("typescript-libraries-importLint"));

/**
 * Full Lint.
 */
gulp.task("fullLint", gulp.series("tsLint", "importLint", "circularDependencies"));

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
 * Get Ready to test Npm Packages.
 */
gulp.task("npmPackages", gulp.series("npmPackages-all"));

/**
 * The default task, concat and min the main BJS files.
 */
gulp.task("default", gulp.series("tsLint", "importLint", "circularDependencies", "typescript-all", "intellisense", "typedoc-all", "tests-all"));
