var through = require('through');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var path = require('path');


var shaders = function shaders(name) {

  var firstFile = null;
  var content = {};

  function bufferContents(file){
    if (file.isNull()) return; // ignore
    if (file.isStream()) return this.emit('error', new PluginError('gulp-shaders',  'Streaming not supported'));

    if (!firstFile) firstFile = file;

    var fileName = file.path
      .replace(file.base, '')
      .replace('.fragment', 'Pixel')
      .replace('.vertex', 'Vertex')
      .replace('.fx', 'Shader');

    content[fileName] = file.contents.toString();
  }

  function endStream(){

    var joinedPath = path.join(firstFile.base, name);

    var joinedFile = new File({
      cwd: firstFile.cwd,
      base: firstFile.base,
      path: joinedPath,
      contents: new Buffer('BABYLON.Effect.ShadersStore='+JSON.stringify(content)+';')
    });


    this.emit('data', joinedFile);
    this.emit('end');

  }

  return through(bufferContents, endStream);
}

module.exports = shaders;
