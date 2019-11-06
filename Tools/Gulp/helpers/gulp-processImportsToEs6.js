// Dependencies.
var through = require('through2');
var PluginError = require('plugin-error');
let fs = require('fs');

/**
 * Replace all imports by their corresponding ES6 imports.
 */
function processImports(sourceCode, replacements) {

    for (let replacement of replacements) {
        var regex = new RegExp(`(["'])${replacement.packageName}([/"'])`, "g");
        sourceCode = sourceCode.replace(regex, `$1${replacement.newPackageName}$2`);
    }

    return sourceCode;
}

/**
 * Replaces all imports by their es6 peers.
 */
function main(replacements) {
    return through.obj(function (file, enc, cb) {
            if (file.isNull()) {
                cb(null, file);
                return;
            }
            if (file.isStream()) {
                cb(new PluginError("Process Imports", "Streaming not supported."));
            }

            let data = file.contents.toString();
            data = processImports(data, replacements);

            // Go to disk.
            fs.writeFileSync(file.path, data);

            return cb();
        });
}

module.exports = main;