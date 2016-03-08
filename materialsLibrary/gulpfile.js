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
var uncommentShader = require("./gulp-removeShaderComments");

var config = require("./config.json");
var extendsSearchRegex = /var\s__extends[\s\S]+?\};/g;

//function to convert the shaders' filenames to variable names.
function shadersName(filename) {
    return filename.replace('.fragment', 'Pixel')
      .replace('.vertex', 'Vertex')
      .replace('.fx', 'Shader');
}

function includeShadersName(filename) {
    return filename.replace('.fx', '');
}

gulp.task('copyReference', function () {
    return gulp.src("../dist/preview release/babylon.max.js").pipe(gulp.dest("test/refs"));
});

/*
Compiles all typescript files and creating a declaration file.
*/
gulp.task('default', ["copyReference"], function () {
    var tasks = config.materials.map(function (material) {
        var compilOutput = gulp.src(material.file)
            .pipe(typescript({
                noExternalResolve: false,
                target: 'ES5',
                declarationFiles: true,
                typescript: require('typescript'),
                experimentalDecorators: true
            }));

        var js = compilOutput.js;
        
        var dts = [];
        if (material.declarationFilename) {
            // Build definitions file
            dts = compilOutput.dts
                .pipe(concat(material.declarationFilename))
                .pipe(gulp.dest(config.build.dtsOutputDirectory));
        }
        else {
            // Build definitions file
            dts = compilOutput.dts
                .pipe(gulp.dest(config.build.dtsOutputDirectory));
        }
        
        var shader = gulp.src(material.shaderFiles)
                .pipe(uncommentShader())
                .pipe(srcToVariable("BABYLON.Effect.ShadersStore", true, shadersName));

        if (!material.referenceFiles) {
            material.referenceFiles = [];
        }
        
        var includeShader = gulp.src(material.referenceFiles)
            .pipe(uncommentShader())
            .pipe(srcToVariable("BABYLON.Effect.IncludesShadersStore", true, includeShadersName));
        
        return merge2(js, shader, includeShader)
            .pipe(cleants())
            .pipe(replace(extendsSearchRegex, ""))
            .pipe(concat(material.output))
            .pipe(gulp.dest(config.build.distOutputDirectory))
            .pipe(rename({extname: ".min.js"}))
            .pipe(uglify())
            .pipe(gulp.dest(config.build.distOutputDirectory));
    });

    return tasks;
});

/**
 * Web server task to serve a local test page
 */
gulp.task('webserver', function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: false,
      open: 'http://localhost:1338/test/index.html',
      port: 1338,
      fallback: 'index.html'
    }));
});

