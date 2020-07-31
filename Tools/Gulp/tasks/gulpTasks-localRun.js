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
gulp.task("webserver", function () {
    var rootRelativePath = "../../";
    var options = {
        root: rootRelativePath,
        port: 1338,
        livereload: false,
        middleware: function (connect, opt) {
            return [function (req, res, next) {
                let referer = req.headers['referer'];
                const baseUrl =  ((req.url.indexOf('dist/preview') !== -1) || req.url.indexOf('Tools') !== -1  || req.url.indexOf('temp/') !== -1);
                if (!baseUrl && referer) {
                    referer = referer.toLowerCase();
                    if (referer.indexOf('/playground/') !== -1 && req.url.indexOf('/Playground/') === -1) {
                        req.url = "/Playground/" + req.url;
                        res.writeHead(301, {
                            'Location': req.url
                        });
                        return res.end();
                    }
                    if (referer.indexOf('/localdev/') !== -1 && referer.indexOf(req.originalUrl) === -1) {
                        if (!fs.existsSync(rootRelativePath + req.originalUrl)) {
                            req.url = "/Playground/" + req.url.replace(/localDev/ig, "");
                        }
                    }
                    if (referer.indexOf('/localdevwebgpu/') !== -1 && referer.indexOf(req.originalUrl) === -1) {
                        if (!fs.existsSync(rootRelativePath + req.originalUrl)) {
                            req.url = "/Playground/" + req.url.replace(/localdevwebgpu/ig, "");
                        }
                    }
                }

                const pgMath = req.url.match(/\/Playground\/pg\/(.*)/);
                if (pgMath) {
                    const isAFile = req.url.indexOf('.') !== -1;
                    const withRevision = req.url.match(/\/pg\/(.*)\/revision\/(\d*)/);
                    if (withRevision) {
                        revision = withRevision[2];
                        if (isAFile) {
                            req.url = req.url.replace(/\/pg\/(.*)\/revision\//gi, "/")
                        } else {
                            req.url = req.url.replace(/\/pg\/(.*)\/revision\/(\d*)/gi, "/?pg=$1&revision=$2")
                        }
                    } else {
                        if (isAFile) {
                            req.url = req.url.replace(/\/pg\//gi, "/")
                        } else {
                            req.url = req.url.replace(/\/pg\/(.*)/gi, "/?pg=$1")
                        }
                    }
                }
                var extension = path.extname(decodeURIComponent(req.originalUrl));
                if (req.originalUrl.indexOf(config.build.localDevES6FolderName) > -1 && skipExtensions.indexOf(extension) === -1) {
                    // Append .js for es6 modules.
                    if (!fs.existsSync(rootRelativePath + req.originalUrl)) {
                        req.url += ".js";
                    }
                }

                next();
            }]
        }
    };

    if (commandLineOptions.public) {
        options.host = "0.0.0.0";
    }

    if (commandLineOptions.ssl) {
        options.https = true;
    }

    connect.server(options);
});