// Import Dependencies.
var gulp = require("gulp");
var del = require("del");

// Cleanup Netlify folder before deploy.
gulp.task("netlify-cleanup", function() {
    //set by netlify
    if (process.env.REPOSITORY_URL) {
        return del([
            "../../../inspector/node_modules/**/*",
            "../../../gui/node_modules/**/*",
            "../../../Viewer/node_modules/**/*"
        ], { force: true });
    }
    else {
        return Promise.resolve();
    }
})