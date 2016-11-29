var gulp = require("gulp");
var uglify = require("gulp-uglify");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var srcToVariable = require("gulp-content-to-variable");
var appendSrcToVariable = require("./gulp-appendSrcToVariable");
var addDtsExport = require("./gulp-addDtsExport");
var addModuleExports = require("./gulp-addModuleExports");
var merge2 = require("merge2");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var cleants = require('gulp-clean-ts-extends');
var changedInPlace = require('gulp-changed-in-place');
var runSequence = require('run-sequence');
var replace = require("gulp-replace");
var uncommentShader = require("./gulp-removeShaderComments");
var expect = require('gulp-expect-file');
var optimisejs = require('gulp-optimize-js');
var webserver = require('gulp-webserver');
var path = require('path');

var config = require("./config.json");

var debug = require('gulp-debug');
var includeShadersStream;
var shadersStream;
var workersStream;

var extendsSearchRegex = /var\s__extends[\s\S]+?\};/g;
var decorateSearchRegex = /var\s__decorate[\s\S]+?\};/g;

/**
 * TS configurations shared in the gulp file.
 */
var tsConfig = {
    noExternalResolve: true,
    target: 'ES5',
    declarationFiles: true,
    typescript: require('typescript'),
    experimentalDecorators: true,
    isolatedModules: false
};
var tsProject = typescript.createProject(tsConfig);

var externalTsConfig = {
    noExternalResolve: false,
    target: 'ES5',
    declarationFiles: true,
    typescript: require('typescript'),
    experimentalDecorators: true,
    isolatedModules: false
};

/*
 * Shader Management.
 */
function shadersName(filename) {
    return filename.replace('.fragment', 'Pixel')
        .replace('.vertex', 'Vertex')
        .replace('.fx', 'Shader');
}

function includeShadersName(filename) {
    return filename.replace('.fx', '');
}

/*
 * Main necessary files stream Management.
 */
gulp.task("includeShaders", function (cb) {
    includeShadersStream = config.includeShadersDirectories.map(function (shadersDef) {
        return gulp.src(shadersDef.files).
            pipe(expect.real({ errorOnFailure: true }, shadersDef.files)).
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
            pipe(expect.real({ errorOnFailure: true }, shadersDef.files)).
            pipe(uncommentShader()).
            pipe(srcToVariable({
            variableName: shadersDef.variable, asMap: true, namingCallback: shadersName
        }));
    });
    cb();
});

gulp.task("workers", function (cb) {
    workersStream = config.workers.map(function (workerDef) {
        return gulp.src(workerDef.files).
            pipe(expect.real({ errorOnFailure: true }, workerDef.files)).
            pipe(uglify()).
            pipe(srcToVariable({
                variableName: workerDef.variable
            }));
    });
    cb();
});

/*
* Compiles all typescript files and creating a js and a declaration file.
*/
gulp.task('typescript-compile', function () {
    var tsResult = gulp.src(config.core.typescript)
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject));

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
            //.pipe(addDtsExport("BABYLON"))
            .pipe(gulp.dest(config.build.outputDirectory)),
        tsResult.js
            .pipe(sourcemaps.write("./", 
                {
                    includeContent:false, 
                    sourceRoot: (filePath) => {
                        var repeatCount = filePath.relative.split(path.sep).length - 1;
                        return '../'.repeat(repeatCount); 
                    }
                }))
            .pipe(gulp.dest(config.build.srcOutputDirectory))
    ])
});

/**
 * External library Build (mat, post processes, ...).
 */
gulp.task('materialsLibrary', function () {
    return buildExternalLibraries(config.materialsLibrary);
});

gulp.task('postProcessesLibrary', function () {
    return buildExternalLibraries(config.postProcessesLibrary);
});

gulp.task('proceduralTexturesLibrary', function () {
    return buildExternalLibraries(config.proceduralTexturesLibrary);
});

/**
 * Helper methods to build external library (mat, post processes, ...).
 */
var buildExternalLibraries = function(settings) {
    var tasks = settings.libraries.map(function (library) {
        return buildExternalLibrary(library, settings); 
    });

    return merge2(tasks);
}

var buildExternalLibrary= function(library, settings) {
    var compilOutput = gulp.src(library.file, { base: '../../' })
        .pipe(sourcemaps.init())
        .pipe(typescript(externalTsConfig));

    var js = compilOutput.js;        
    var shader = gulp.src(library.shaderFiles)
            .pipe(uncommentShader())
            .pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", true, shadersName));

    var fulljs = merge2(js, shader)
        .pipe(concat(library.output));

    var unminifiedAndMaps = fulljs.pipe(sourcemaps.write('.temp', {
                includeContent:false,
                sourceRoot: function (file) {
                    return '../';
                }
            }))
        .pipe(gulp.dest(settings.build.distOutputDirectory));

    var minified = fulljs
        .pipe(cleants())
        .pipe(replace(extendsSearchRegex, ""))
        .pipe(replace(decorateSearchRegex, ""))
        .pipe(rename({extname: ".min.js"}))
        .pipe(uglify())
        .pipe(optimisejs())
        .pipe(gulp.dest(settings.build.distOutputDirectory));

    return merge2(unminifiedAndMaps, minified);
}

/**
 * Build tasks to concat minify uflify optimise the BJS js in different flavor (workers...).
 */
gulp.task("buildCore", ["shaders"], function () {
    return merge2(
        gulp.src(config.core.files).        
            pipe(expect.real({ errorOnFailure: true }, config.core.files)),
        shadersStream,
        includeShadersStream
        )
        .pipe(concat(config.build.minCoreFilename))
        .pipe(cleants())
        .pipe(replace(extendsSearchRegex, ""))
        .pipe(replace(decorateSearchRegex, ""))
        .pipe(addModuleExports("BABYLON"))
        .pipe(uglify())
        .pipe(optimisejs())
        .pipe(gulp.dest(config.build.outputDirectory));
});

gulp.task("buildNoWorker", ["shaders"], function () {
    return merge2(
        gulp.src(config.core.files).        
            pipe(expect.real({ errorOnFailure: true }, config.core.files)),
        gulp.src(config.extras.files).        
            pipe(expect.real({ errorOnFailure: true }, config.extras.files)),
        shadersStream,
        includeShadersStream
        )
        .pipe(concat(config.build.minNoWorkerFilename))
        .pipe(cleants())
        .pipe(replace(extendsSearchRegex, ""))
        .pipe(replace(decorateSearchRegex, ""))
        .pipe(addModuleExports("BABYLON"))
        .pipe(uglify())
        .pipe(optimisejs())
        .pipe(gulp.dest(config.build.outputDirectory));
});

gulp.task("build", ["workers", "shaders"], function () {
    return merge2(
        gulp.src(config.core.files).        
            pipe(expect.real({ errorOnFailure: true }, config.core.files)),
        gulp.src(config.extras.files).        
            pipe(expect.real({ errorOnFailure: true }, config.extras.files)),   
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
        .pipe(optimisejs())
        .pipe(gulp.dest(config.build.outputDirectory));
});

/**
 * The default task, concat and min the main BJS files.
 */
gulp.task('default', function (cb) {
    runSequence("buildNoWorker", "build", "buildCore", cb);
});

/**
 * Build the releasable files.
 */
gulp.task("typescript", function (cb) {
    runSequence("typescript-compile", "default", cb);
});

gulp.task("typescript-libraries", ["materialsLibrary", "postProcessesLibrary", "proceduralTexturesLibrary"], function () {
});

gulp.task("typescript-all", function (cb) {
    runSequence("typescript", "typescript-libraries", cb);
});

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task('watch', ['typescript-compile'], function () {
    var tasks = [gulp.watch(config.core.typescript, ['typescript-compile'])];

    config.materialsLibrary.libraries.map(function (material) {
        tasks.push(gulp.watch(material.file, () => buildExternalLibrary(material, config.materialsLibrary)));
        tasks.push(gulp.watch(material.shaderFiles, () => buildExternalLibrary(material, config.materialsLibrary)));
    });

    config.postProcessesLibrary.libraries.map(function (postProcess) {
        tasks.push(gulp.watch(postProcess.file, buildExternalLibrary(postProcess, config.postProcessesLibrary)));
        tasks.push(gulp.watch(postProcess.shaderFiles, buildExternalLibrary(postProcess, config.postProcessesLibrary)));
    });

    config.proceduralTexturesLibrary.libraries.map(function (proceduralTexture) {
        tasks.push(gulp.watch(proceduralTexture.file, buildExternalLibrary(proceduralTexture, config.proceduralTexturesLibrary)));
        tasks.push(gulp.watch(proceduralTexture.shaderFiles, buildExternalLibrary(proceduralTexture, config.proceduralTexturesLibrary)));
    });

    return tasks;
});

/**
 * Embedded webserver for test convenience.
 */
gulp.task('webserver', function () {
    gulp.src('../../.').pipe(webserver({
      port: 1338,
      livereload: false
    }));
});

/**
 * Combine Webserver and Watch as long as vscode does not handle multi tasks.
 */
gulp.task('run', ['watch', 'webserver'], function () {
});