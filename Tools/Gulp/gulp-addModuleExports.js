var gutil = require('gulp-util');
var through = require('through2');

module.exports = function (varName) {
  return through.obj(function (file, enc, cb) {

    var moduleExportsAddition = 
      '\nif (module && module.exports) {\n' +
      '    module.exports = ' + varName + ';\n' +
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
      file.contents = new Buffer(String(file.contents).concat(moduleExportsAddition));
      this.push(file);

    } catch (err) {
      this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, {fileName: file.path}));
    }
    cb();
  });
};