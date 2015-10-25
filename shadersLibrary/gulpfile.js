var gulp = require("gulp");
var uglify = require("gulp-uglify");
var typescript = require("gulp-typescript");
var srcToVariable = require("./gulp-srcToVariable");
var merge2 = require("merge2");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var cleants = require('gulp-clean-ts-extends');
var replace = require("gulp-replace");

var config = require("./config.json");
var extendsSearchRegex = /var\s__extends[\s\S]+?\};/g;

//function to convert the shaders' filenames to variable names.
function shadersName(filename) {
    return filename.replace('.fragment', 'Pixel')
      .replace('.vertex', 'Vertex')
      .replace('.fx', 'Shader');
}

/*
Compiles all typescript files and creating a declaration file.
*/
gulp.task('default', function () {
    var tasks = config.materials.map(function (material) {
        var js = gulp.src(material.file)
            .pipe(typescript({
                noExternalResolve: false,
                target: 'ES5',
                declarationFiles: true,
                typescript: require('typescript')
            })).js;

        var shader = gulp.src(material.shaderFiles).pipe(srcToVariable("BABYLON.Effect.ShadersStore", true, shadersName));

        return merge2(js, shader)
            .pipe(cleants())
            .pipe(replace(extendsSearchRegex, ""))
            .pipe(concat(material.output))
            .pipe(gulp.dest(config.build.distOutputDirectory));
    });

    return tasks;
});
