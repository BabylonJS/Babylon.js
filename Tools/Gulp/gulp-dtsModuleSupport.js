var gutil = require('gulp-util');
var through = require('through2');

// inject - if set to true, it will add all declarations as imports.
module.exports = function (moduleName, inject, declarations) {
    return through.obj(function (file, enc, cb) {

        let fileContent = file.contents.toString();
        let importsString = '';

        if (!inject) {
            declarations[moduleName] = declarations[moduleName] || [];
            let regexp = /    (class|interface|type|const|enum|var) ([\w]*)/g;

            var match = regexp.exec(fileContent);
            while (match != null) {
                if (match[2]) {
                    declarations[moduleName].push(match[2])
                }
                match = regexp.exec(fileContent);
            }
        } else {
            let declared = [];
            Object.keys(declarations).forEach(name => {
                if (name === moduleName) return;
                let imports = declarations[name].filter(obj => {
                    let exists = declared.indexOf(obj) !== -1;
                    if (!exists) {
                        declared.push(obj);
                    }
                    return !exists;
                });
                if (imports.length)
                    importsString += `import {${imports.join(',')}} from 'babylonjs/${name}';
`;
            });
        }

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            //streams not supported, no need for now.
            return;
        }

        try {
            file.contents = new Buffer(String(file.contents) + '\n' + importsString);
            this.push(file);

        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};

