// Dependencies.
var through = require("through2");
var PluginError = require("plugin-error");
let fs = require("fs");

/**
 * Add .js to all local imports
 */
function processImports(sourceCode) {
    return sourceCode.replace(/((import|export)(.*)('|")(@babylonjs|\.{1,2}\/)(.*))('|");/g, "$1.js$7;").replace(/(\.js){2,}/g, ".js");
}

/**
 * Add .js to all local imports
 */
function main() {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        if (file.isStream()) {
            cb(new PluginError("Process Imports", "Streaming not supported."));
        }

        let data = file.contents.toString();
        data = processImports(data);

        // Go to disk.
        fs.writeFileSync(file.path, data);

        return cb();
    });
}

module.exports = main;
