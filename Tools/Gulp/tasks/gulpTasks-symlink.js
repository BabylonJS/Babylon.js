// Import Dependencies.
var gulp = require("gulp");
var symlinkDir = require('symlink-dir')
var path = require('path')

/**
 * Generate our required symlinked for the shared components.
 */
gulp.task("generate-symlinks", function(done) {
    var sharedUiComponents = path.resolve(__dirname, "../../../sharedUiComponents/");
    var inspectorSharedUiComponents = path.resolve(__dirname, "../../../inspector/src/sharedUiComponents/");
    var nodeEditorSharedUiComponents = path.resolve(__dirname, "../../../nodeEditor/src/sharedUiComponents/");

    symlinkDir(sharedUiComponents, inspectorSharedUiComponents).then(() => {
        symlinkDir(sharedUiComponents, nodeEditorSharedUiComponents).then(() => {
             done();
        });
    });
});