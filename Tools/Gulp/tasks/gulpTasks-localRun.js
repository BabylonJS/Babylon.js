// Import Dependencies.
var gulp = require("gulp");
var connect = require("gulp-connect");
var minimist = require("minimist");
var fs = require('fs');
var path = require('path');

// Read the full config.
var config = require("../../Config/config.json");

// Comand line parsing.
var commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["public"]
});

// Skip known extensions.
var skipExtensions = [".js", ".glb", ".gltf", ".bin", ".html", ".gif", ".jpg", ".jpeg", ".png", ".dds", ".babylon", "ktx", ".map"];

/**
 * Embedded webserver for test convenience.
 */
gulp.task("webserver", function() {
    var rootRelativePath = "../../";
    var options = {
        root: rootRelativePath,
        port: 1338,
        livereload: false,
        middleware: function(connect, opt) {
            return [function (req, res, next) {
                var extension = path.extname(decodeURIComponent(req.originalUrl));
                if (req.originalUrl.indexOf(config.build.localDevES6FolderName) > -1 && skipExtensions.indexOf(extension) === -1) {
                    // Append .js for es6 modules.
                    if (!fs.existsSync(rootRelativePath + req.originalUrl)) {
                        req.url += ".js";
                    }
                }
                next();
              }
            ]
        }
    };

    if (commandLineOptions.public) {
        options.host = "0.0.0.0";
    }

    connect.server(options);
});