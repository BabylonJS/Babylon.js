var gulp = require("gulp");
var uglify = require("gulp-uglify");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var srcToVariable = require("gulp-content-to-variable");
var addModuleExports = require("./gulp-addModuleExports");
var merge2 = require("merge2");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var cleants = require('gulp-clean-ts-extends');
var changed = require('gulp-changed');
var runSequence = require('run-sequence');
var replace = require("gulp-replace");
var uncommentShader = require("./gulp-removeShaderComments");

var config = require("./config.json");

var includeShadersStream;
var shadersStream;
var workersStream;

var extendsSearchRegex = /var\s__extends[\s\S]+?\};/g;
var decorateSearchRegex = /var\s__decorate[\s\S]+?\};/g;

//function to convert the shaders' filenames to variable names.
function shadersName(filename) {
    return filename.replace('.fragment', 'Pixel')
        .replace('.vertex', 'Vertex')
        .replace('.fx', 'Shader');
}

function includeShadersName(filename) {
    return filename.replace('.fx', '');
}

gulp.task("includeShaders", function (cb) {
    includeShadersStream = config.includeShadersDirectories.map(function (shadersDef) {
        return gulp.src(shadersDef.files).
            pipe(uncommentShader()).
            pipe(srcToVariable({
            variableName: shadersDef.variable, asMap: true, namingCallback: includeShadersName
        }));
    });
    cb();
});

gulp.task("shaders", ["includeShaders"], function (cb) {
    shadersStream = config.shadersDirectories.map(function (shadersDef) {
        return gulp.src(shadersDef.files).
            pipe(uncommentShader()).
            pipe(srcToVariable({
            variableName: shadersDef.variable, asMap: true, namingCallback: shadersName
        }));
    });
    cb();
});

gulp.task("workers", function (cb) {
    workersStream = config.workers.map(function (workerDef) {
        return gulp.src(workerDef.files).pipe(uglify()).pipe(srcToVariable({
            variableName: workerDef.variable
        }));
    });
    cb();
});

/*
Compiles all typescript files and creating a declaration file.
*/
gulp.task('typescript-compile', function () {
    var tsResult = gulp.src(config.core.typescript)
        .pipe(typescript({
            noExternalResolve: true,
            target: 'ES5',
            declarationFiles: true,
            typescript: require('typescript'),
            experimentalDecorators: true
        }));
    //If this gulp task is running on travis, file the build!
    if (process.env.TRAVIS) {
        var error = false;
        tsResult.on('error', function () {
            error = true;
        }).on('end', function () {
            if (error) {
                console.log('Typescript compile failed');
                process.exit(1);
            }
        });
    }
    return merge2([
        tsResult.dts
            .pipe(concat(config.build.declarationFilename))
            .pipe(gulp.dest(config.build.outputDirectory)),
        tsResult.js
            .pipe(gulp.dest(config.build.srcOutputDirectory))
    ])
});

gulp.task('typescript-sourcemaps', function () {
    var tsResult = gulp.src(config.core.typescript)
        .pipe(sourcemaps.init()) // sourcemaps init. currently redundant directory def, waiting for this - https://github.com/floridoo/gulp-sourcemaps/issues/111
        .pipe(typescript({
            noExternalResolve: true,
            target: 'ES5',
            declarationFiles: true,
            typescript: require('typescript'),
            experimentalDecorators: true
        }));
    return tsResult.js
        .pipe(sourcemaps.write("./")) // sourcemaps are written.
        .pipe(gulp.dest(config.build.srcOutputDirectory));
});

gulp.task("buildCore", ["shaders"], function () {
    return merge2(
        gulp.src(config.core.files),
        shadersStream,
        includeShadersStream
        )
        .pipe(concat(config.build.minCoreFilename))
        .pipe(cleants())
        .pipe(replace(extendsSearchRegex, ""))
        .pipe(replace(decorateSearchRegex, ""))
        .pipe(addModuleExports("BABYLON"))
        .pipe(uglify())
        .pipe(gulp.dest(config.build.outputDirectory));
});

gulp.task("buildNoWorker", ["shaders"], function () {
    return merge2(
        gulp.src(config.core.files),
        gulp.src(config.extras.files),
        shadersStream,
        includeShadersStream
        )
        .pipe(concat(config.build.minNoWorkerFilename))
        .pipe(cleants())
        .pipe(replace(extendsSearchRegex, ""))
        .pipe(replace(decorateSearchRegex, ""))
        .pipe(addModuleExports("BABYLON"))
        .pipe(uglify())
        .pipe(gulp.dest(config.build.outputDirectory));
});

gulp.task("build", ["workers", "shaders"], function () {
    return merge2(
        gulp.src(config.core.files),
        gulp.src(config.extras.files),
        shadersStream,
        includeShadersStream,
        workersStream
        )
        .pipe(concat(config.build.filename))
        .pipe(cleants())
        .pipe(replace(extendsSearchRegex, ""))
        .pipe(replace(decorateSearchRegex, ""))
        .pipe(addModuleExports("BABYLON"))
        .pipe(gulp.dest(config.build.outputDirectory))
        .pipe(rename(config.build.minFilename))
        .pipe(uglify())
        .pipe(gulp.dest(config.build.outputDirectory));
});

gulp.task("typescript", function (cb) {
    runSequence("typescript-compile", "default", cb);
});

/**
 * The default task, call the tasks: build
 */
gulp.task('default', function (cb) {
    runSequence("buildNoWorker", "build", "buildCore", cb);
});

/**
 * Watch task, will call the default task if a js file is updated.
 */
gulp.task('watch', function () {
    gulp.watch(config.core.typescript, ['build']);
});

/**
 * Watch typescript task, will call the default typescript task if a typescript file is updated.
 */
gulp.task('watch-typescript', function () {
    gulp.watch(config.core.typescript, ["typescript-compile", "build"]);
});
