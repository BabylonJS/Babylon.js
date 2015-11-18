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

    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      //streams not supported, no need for now.
      return;
    }

    try {
      file.contents = new Buffer(extendsAddition.concat(String(file.contents)).concat(moduleExportsAddition));
      this.push(file);

    } catch (err) {
      this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, {fileName: file.path}));
    }
    cb();
  });
};
