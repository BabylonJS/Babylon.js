// Dependencies.
var through = require('through2');
var PluginError = require('plugin-error');
let fs = require('fs');

/**
 * Encapsulates types in declare global { }
 */
function processLooseDeclarations(sourceCode) {
    // To replace if that causes issue (defining start point of the concat
    // as interface like the first code line of the first mixin)
    sourceCode = sourceCode.replace(/declare /g, "");
    sourceCode = sourceCode.replace(/interface /, `declare global {
interface `);
    sourceCode += `
}`;

    return sourceCode;
}

/**
 * Prepare loose declarations to be added to the package.
 */
function main(replacements) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        if (file.isStream()) {
            cb(new PluginError("Process Shader", "Streaming not supported."));
        }

        let data = file.contents.toString();
        data = processLooseDeclarations(data, replacements);

        file.contents = Buffer.from(data);
        this.push(file);

        return cb();
    });
}

module.exports = main;