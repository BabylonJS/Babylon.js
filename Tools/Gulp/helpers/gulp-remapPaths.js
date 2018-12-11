'use strict';

var through = require('through2');
var PluginError = require('plugin-error');

function modifyPath(str, opts) {
    // opts = opts || {};

    // str += "";

    // // Start process by extracting all lines.
    // let lines = str.split('\n');

    // // Let's go line by line and replace the imports sources by their resolved locations
    // for (let index = 0; index < lines.length; index++) {
    //     let line = lines[index];

    //     // Replace Static Readonly declaration for Legacy TS Version compat
    //     var regexVar = /(.*)import .*"(.*)";/g;
    //     var match = regexVar.exec(line);
    //     if (!match) {
    //         continue;
    //     }

    //     // Extract the typescript node based import location
    //     const location = match[2];
    //     const newLocation = location;

    //     // Adds file relative path
    //     if (!location.startsWith(".")) {

    //     }

    //     // Adds Extension


    //     // Replace the location by the new one
    //     line = line.replace('"' + location + '"', '"' + newLocation + '"');
    //     lines[index] = line;
    // }

    // // Recreate the file.
    // str = lines.join('\n');
    return Date.now() + str;
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
        file.contents = Buffer.from(func(file.contents.toString(), options));
        this.push(file);
        return cb();
    });
}

function gulpModifyPath(options) {
    return main(options, modifyPath);
}

module.exports = gulpModifyPath;