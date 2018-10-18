var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

// inject - if set to true, it will add all declarations as imports.
module.exports = function (moduleName, inject, declarations, perFile, dependencyTree) {
    return through.obj(function (file, enc, cb) {
        let basename = (path.basename(file.path, ".d.ts"));
        let fileContent = file.contents.toString();
        let importsString = '';

        if (!inject) {
            perFile[basename] = perFile[basename] || {
                module: [moduleName],
                dependencies: [],
                declarations: []
            };
            if (perFile[basename].module.indexOf(moduleName) === -1) {
                perFile[basename].module.push(moduleName);
            }
            declarations[moduleName] = declarations[moduleName] || [];
            let regexp = /    (abstract class|function|class|interface|type|const|enum|var) ([\w]*)/g;

            var match = regexp.exec(fileContent);
            while (match != null) {
                if (match[2]) {
                    // check it is not SIMD:
                    let simdMatch = /    interface (\w*\dx\d{1,2}\w*)/.exec(match[0]);
                    if (!simdMatch && match[2] !== 'earcut' && match[2] !== 'deviation' && match[2] !== 'flatten') {
                        declarations[moduleName].push(match[2]);
                        perFile[basename].declarations.push(match[2]);
                    }
                }
                match = regexp.exec(fileContent);
            }
        } else {
            /*let declared = [];
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
            });*/

            // find all of the related files for the dependency tree integration
            let basenames = Object.keys(perFile).filter(basefilename => {
                return perFile[basefilename].module.indexOf(moduleName) !== -1;
            });

            let classesForImports = {} // key : module name, content - array of objects
            basenames.forEach(bname => {
                dependencyTree[bname].forEach(dep => {
                    if (dep.module.indexOf(moduleName) !== -1) return;
                    let depModule = dep.module.indexOf("core") === -1 ? dep.module[0] : "core";
                    classesForImports[depModule] = classesForImports[depModule] || [];
                    if (classesForImports[depModule].indexOf(dep.name) === -1) {
                        //babylon.imageProcessingPostProcess
                        classesForImports[depModule].push(dep.name);
                    }
                });
            });

            Object.keys(classesForImports).forEach(modName => {
                importsString += `import {${classesForImports[modName].join(',')}} from 'babylonjs/${modName}';
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
            file.contents = Buffer.from(String(file.contents) + '\n' + importsString);
            this.push(file);

        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};

