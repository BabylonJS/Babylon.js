var gutil = require('gulp-util');
var through = require('through2');

module.exports = function (varName, moduleName, subModule, extendsRoot) {
    return through.obj(function (file, enc, cb) {

        let exportText = "BABYLON";
        if (subModule && !extendsRoot) {
            exportText += '.' + varName;
        }

        var moduleExportsAddition =
            `${subModule ? '/// <reference types="babylonjs"/>' : ''}

declare module '${moduleName}' { 
    export = ${exportText}; 
}
`;

        //'export = ' + (subModule ? 'BABYLON.' : '') + varName + ';\n';// +
        //'export as namespace ' + varName + ';\n\n';


        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            //streams not supported, no need for now.
            return;
        }

        try {
            file.contents = new Buffer(moduleExportsAddition + String(file.contents));
            this.push(file);

        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};

