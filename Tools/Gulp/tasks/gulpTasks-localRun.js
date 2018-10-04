// Import Dependencies.
var gulp = require("gulp");
var webserver = require("gulp-webserver");
var minimist = require("minimist");

// Comand line parsing.
var commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["public"]
});

/**
 * Embedded webserver for test convenience.
 */
gulp.task("webserver", function() {
    var options = {
        port: 1338,
        livereload: false,

    };

    if (commandLineOptions.public) {
        options.host = "0.0.0.0";
    }

    return gulp.src("../../.").pipe(webserver(options));
});