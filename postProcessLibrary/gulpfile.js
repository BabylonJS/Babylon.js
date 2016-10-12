var gulp = require("gulp");
var typescript = require("gulp-typescript");
var srcToVariable = require("./gulp-srcToVariable");
var merge2 = require("merge2");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var cleants = require('gulp-clean-ts-extends');
var replace = require("gulp-replace");
var webserver = require('gulp-webserver');
var uglify = require("gulp-uglify");

var config = require("./config.json");
var extendsSearchRegex = /var\s__extends[\s\S]+?\};/g;

//function to convert the shaders' filenames to variable names.
function shadersName(filename) {
    return filename.replace('.fragment', 'Pixel')
      .replace('.vertex', 'Vertex')
      .replace('.fx', 'Shader');
}

gulp.task('copyReference', function () {
    return gulp.src("../dist/preview release/babylon.max.js").pipe(gulp.dest("test/refs"));
});

/*
Compiles all typescript files and creating a declaration file.
*/
gulp.task('default', ["copyReference"], function () {
    var tasks = config.proceduralTextures.map(function (proceduralTexture) {
        var js = gulp.src(proceduralTexture.file)
            .pipe(typescript({
                noExternalResolve: false,
                target: 'ES5',
                declarationFiles: true,
                typescript: require('typescript'),
                experimentalDecorators: true
            })).js;

        var shader = gulp.src(proceduralTexture.shaderFiles).pipe(srcToVariable("BABYLON.Effect.ShadersStore", true, shadersName));

        return merge2(js, shader)
            .pipe(cleants())
            .pipe(replace(extendsSearchRegex, ""))
            .pipe(concat(proceduralTexture.output))
            .pipe(gulp.dest(config.build.distOutputDirectory))
            .pipe(rename({extname: ".min.js"}))
            .pipe(uglify())
            .pipe(gulp.dest(config.build.distOutputDirectory));
    });

    return tasks;
});
