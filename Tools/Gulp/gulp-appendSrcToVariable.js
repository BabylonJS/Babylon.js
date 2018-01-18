var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var path = require('path');
var File = gutil.File;

// Consts
const PLUGIN_NAME = 'gulp-appendSrcToVariable';

var appendSrcToVariable = function appendSrcToVariable(varName, namingCallback, output, moduleType) {

    var content;
    var firstFile;

    namingCallback = namingCallback || function (filename) { return filename; };

    function bufferContents(file, enc, cb) {
        // ignore empty files
        if (file.isNull()) {
            cb();
            return;
        }

        // no stream support, only files.
        if (file.isStream()) {
            this.emit('error', new PluginError('gulp-concat', 'Streaming not supported'));
            cb();
            return;
        }

        // construct concat instance
        if (!content) {
            content = "";
        }

        // set first file if not already set
        if (!firstFile) {
            if (moduleType === "es6") {
                content += `
// import * as BABYLON from 'babylonjs/core/es6';
`;
            }
            firstFile = file;
        }


        var name = namingCallback(file.relative);
        if (moduleType) {
            let vars = varName.split(".");
            // shader support when using modules
            if (moduleType === "es6") {
                content += `
let ${name} = ${JSON.stringify(file.contents.toString())};
// ${varName}["${name}"] = ${varName}["${name}"] || ${name};
export { ${name}  };
`;
            } else {
                // commonjs
                content += `
if(typeof require !== 'undefined'){
var BABYLON = require("babylonjs/core");
let data = ${JSON.stringify(file.contents.toString())};
${varName}["${name}"] = ${varName}["${name}"] || data;
module.exports = module.exports || {};
module.exports["${name}"] = data;
}
`;
            }
        } else {
            content += varName + "['" + name + "'] = " + JSON.stringify(file.contents.toString()) + ";\r\n";
        }
        cb();
    }

    function endStream(cb) {
        if (!firstFile || !content) {
            cb();
            return;
        }

        var pathObject = path.parse(firstFile.path);
        var joinedPath = path.join(pathObject.dir, output);

        var joinedFile = new File({
            cwd: firstFile.cwd,
            base: firstFile.base,
            path: joinedPath,
            contents: new Buffer(content)
        });

        this.push(joinedFile);

        cb();
    }

    return through.obj(bufferContents, endStream);
}

module.exports = appendSrcToVariable;