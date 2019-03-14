'use strict';

var through = require('through2');
var path = require('path');
var fs = require('fs');
var PluginError = require('plugin-error');

function modifyPath(str, filePath, opts) {
    opts = opts || {};
    str += "";

    // Start process by extracting all lines.
    let lines = str.split('\n');

    // Let's go line by line and replace the imports sources by their resolved locations
    for (let index = 0; index < lines.length; index++) {
        let line = lines[index];

        // Replace Static Readonly declaration for UMD TS Version compat
        var regexVar = /(.*)import .*"(.*)";/g;
        var match = regexVar.exec(line);
        if (match) {
            // Extract the typescript node based import location
            const location = match[2];
            let newLocation = location;
    
            // Adds file relative path
            const lastSlash = location.lastIndexOf("/");
            let pathToTest = location;
            if (lastSlash > -1) {
                pathToTest = location.slice(lastSlash + 1);
            }
            if (pathToTest.match(/^[A-Z].*/g)) {
                if (!pathToTest.startsWith("I") || pathToTest === "Instrumentation" || pathToTest === "Inputs") {
                    newLocation += "/index";
                }
            }

            if (!location.startsWith(".")) {
                const rel = path.relative(filePath, opts.basePath);
                const count = (rel.match(/..\\/g) || []).length;
                if (count === 0) {
                    newLocation = "./" + newLocation;
                }
                else {
                    for (let i = 0; i < count; i++) {
                        newLocation = "../" + newLocation;
                    }
                }
            }
    
            // Replace the location by the new one
            line = line.replace('"' + location + '"', '"' + newLocation + '"');
        }

        regexVar = /export \* from "(.*)";/g;
        match = regexVar.exec(line);
        if (match) {
            // Extract the typescript node based import location
            const location = match[1];
            let newLocation = location;

            if (location.match(/\.\/[A-Z].*/g)) {
                if (location[2] !== "I" || location === "./Instrumentation" || location === "./Inputs") {
                    newLocation += "/index";
                }
            }

            // Replace the location by the new one
            line = line.replace('"' + location + '"', '"' + newLocation + '"');
        }

        lines[index] = line;
    }

    // Recreate the file.
    str = lines.join('\n');
    return str;
}

function main(options, func) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        if (file.isStream()) {
            cb(new PluginError("Modify Import Paths", "Streaming not supported."));
        }
        file.contents = Buffer.from(func(file.contents.toString(), file.path, options));
        this.push(file);
        return cb();
    });
}

function gulpModifyPath(options) {
    return main(options, modifyPath);
}

module.exports = gulpModifyPath;