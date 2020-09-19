// Dependencies.
var through = require('through2');
var PluginError = require('plugin-error');
const fs = require('fs');
const constantModule = __dirname + '/../../../dist/preview release/babylon.max';

let _babylonConstants = undefined;
function getBabylonConstants() {
    if (!_babylonConstants) {
        _babylonConstants = require(constantModule).Constants;
    }
    return _babylonConstants;
}

/**
 * Replace all constants by their inlined values.
 */
function processConstants(sourceCode) {
    const babylonConstants = getBabylonConstants();

    var regexImport = /import { Constants } from .*;/g;
    sourceCode = sourceCode.replace(regexImport, "");

    var regexConstant = /(?<![_0-9a-zA-Z])Constants\.([_0-9a-zA-Z]*)/g;
    var match = regexConstant.exec(sourceCode);
    var constantList = [];
    while (match) {
        var constantName = match[1];
        if (constantName && constantName.length > 1) {
            constantList.push(constantName);
        }
        match = regexConstant.exec(sourceCode);
    }

    for (var constant of constantList) {
        var value = babylonConstants[constant];
        var regex = new RegExp(`(?<![_0-9a-zA-Z])Constants\.${constant}(?![_0-9a-zA-Z])`, "g");
        sourceCode = sourceCode.replace(regex, value);
    }

    return sourceCode;
}

/**
 * Replaces all constants by their inlined values.
 */
function main() {
    return through.obj(function (file, enc, cb) {
            if (file.isNull()) {
                cb(null, file);
                return;
            }
            if (file.isStream()) {
                cb(new PluginError("Process Constants", "Streaming not supported."));
            }

            let data = file.contents.toString();
            data = processConstants(data);

            // Go to disk.
            fs.writeFileSync(file.path, data);

            return cb();
        });
}

module.exports = main;