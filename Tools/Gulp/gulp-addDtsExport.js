var gutil = require('gulp-util');
var through = require('through2');

module.exports = function (varName, moduleName, subModule, extendsRoot, dependencies) {
    return through.obj(function (file, enc, cb) {

        let exportText = "BABYLON";
        if (subModule && !extendsRoot) {
            exportText += '.' + varName.name;
        }

        let referenceText = '';
        if (subModule) {
            //referenceText = '/// <reference types="babylonjs"/>\n';
        }

        if (dependencies) {
            referenceText = '';
            dependencies.forEach(element => {
                // was "babylonjs/${element}""
                referenceText += `/// <reference types="${element}"/>
`;
            });
        }

        var moduleExportsAddition =
            `${referenceText}

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
            file.contents = Buffer.from(moduleExportsAddition + String(file.contents));
            this.push(file);

        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};

