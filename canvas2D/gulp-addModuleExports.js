var gutil = require('gulp-util');
var through = require('through2');

module.exports = function (varName) {
    return through.obj(function (file, enc, cb) {

        var moduleExportsAddition =
          '\nif (((typeof window != "undefined" && window.module) || (typeof module != "undefined")) && typeof module.exports != "undefined") {\n' +
          '    module.exports = ' + varName + ';\n' +
          '};\n';

        var extendsAddition =
        'var __extends = (this && this.__extends) || function (d, b) {\n' +
          'for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];\n' +
          'function __() { this.constructor = d; }\n' +
          '__.prototype = b.prototype;\n' +
          'd.prototype = new __();\n' +
        '};\n';

        var decorateAddition =
        'var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {\n' +
            'var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;\n' +
            'if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);\n' +
            'else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;\n' +
            'return c > 3 && r && Object.defineProperty(target, key, r), r;\n' +
        '};\n';

        var dependencyAddition =
        'if (typeof BABYLON === "undefined") {\n' +
            'throw "BabylonJS is a required dependency, please include it first!"\n' +
        '};\n';

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            //streams not supported, no need for now.
            return;
        }

        try {
            file.contents = new Buffer(decorateAddition.concat(new Buffer(extendsAddition.concat(dependencyAddition).concat(String(file.contents)).concat(moduleExportsAddition))));
            this.push(file);

        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};

