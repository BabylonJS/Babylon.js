var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

module.exports = function (moduleName, perFile, declared, depTree) {
    return through.obj(function (file, enc, cb) {
        let basename = (path.basename(file.path, ".ts"));
        depTree[basename] = depTree[basename] || [];
        // detect dependencies
        let depReg1 = /[:,][ ]{0,1}([_A-Za-z]\w*)/g;
        let depReg2 = /<([A-Z]\w*)(\[\]){0,1}>/g;
        let depReg3 = /[\s(]([A-Z]\w*)\./g;
        let depReg4 = /[new|extends|implements] ([A-Z]\w*)/g;

        let dependencies = [];
        fileContent = file.contents.toString();
        function findWhereDeclared(objectName) {
            let fileLocator;
            Object.keys(perFile).some((filename => {
                filedec = perFile[filename];
                if (filedec.declarations.indexOf(objectName) !== -1) {
                    fileLocator = filename;
                    return true;
                }
                return false;
            }))
            return fileLocator;
        }

        //if (basename === "babylon.webVRCamera") {
        [depReg1, depReg2, depReg3, depReg4].forEach(reg => {
            var match = reg.exec(fileContent);
            while (match != null) {
                if (match[1]) {
                    let dep = match[1];
                    //find if it is declared internally
                    if (perFile[basename].declarations.indexOf(dep) === -1) {
                        // not internally? maybe it is in core?
                        //if (declared.core.indexOf(dep) === -1) {
                        // seems like a legit dependency! was it already added?
                        if (perFile[basename].dependencies.indexOf(dep) === -1) {
                            //no! add it.
                            let whereDeclared = (findWhereDeclared(dep));
                            if (whereDeclared) {
                                perFile[basename].dependencies.push(dep);
                                depTree[basename].push({
                                    name: dep,
                                    file: whereDeclared,
                                    module: perFile[whereDeclared].module
                                });
                            }
                        }
                        //}
                    }
                }
                match = reg.exec(fileContent);
            }
        });
        //}


        try {
            this.push(file);

        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-calculateDependencies', err, { fileName: file.path }));
        }
        cb();
    });
};

