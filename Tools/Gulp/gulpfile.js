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
var sass = require('gulp-sass');
var webpack = require('webpack-stream');

var zip = require('gulp-zip');

var config = require("./config.json");

var del = require('del');

var debug = require('gulp-debug');
var includeShadersStream;
var shadersStream;
var workersStream;

var extendsSearchRegex = /var\s__extends[\s\S]+?\}\)\(\);/g;
var decorateSearchRegex = /var\s__decorate[\s\S]+?\};/g;

/**
 * TS configurations shared in the gulp file.
 */
var tsConfig = {
    noResolve: true,
    target: 'ES5',
    declarationFiles: true,
    typescript: require('typescript'),
    experimentalDecorators: true,
    isolatedModules: false
};
var tsProject = typescript.createProject(tsConfig);

var externalTsConfig = {
    noResolve: false,
    target: 'ES5',
    declarationFiles: true,
    typescript: require('typescript'),
    experimentalDecorators: true,
    isolatedModules: false
};

function processDependency(kind, dependency, filesToLoad) {
    if (dependency.dependUpon) {
        for (var i = 0; i < dependency.dependUpon.length; i++) {
            var dependencyName = dependency.dependUpon[i];
            var parent = config.workloads[dependencyName];
            processDependency(kind, parent, filesToLoad);
        }
    }

    var content = dependency[kind];
    if (!content) {
        return;
    }

    for (var i = 0; i < content.length; i++) {
        var file = content[i];

        if (filesToLoad.indexOf(file) === -1) {
            filesToLoad.push(file);
        }
    }
}

function determineFilesToProcess(kind) {
    var currentConfig = config.build.currentConfig;
    var buildConfiguration = config.buildConfigurations[currentConfig];
    var filesToLoad = [];

    for (var index = 0; index < buildConfiguration.length; index++) {
        var dependencyName = buildConfiguration[index];
        var dependency = config.workloads[dependencyName];
        processDependency(kind, dependency, filesToLoad);
    }

    if (kind === "shaderIncludes") {
        for (var index = 0; index < filesToLoad.length; index++) {
            filesToLoad[index] = "../../src/Shaders/ShadersInclude/" + filesToLoad[index] + ".fx";
        }
    } else if (kind === "shaders") {
        for (var index = 0; index < filesToLoad.length; index++) {
            var name = filesToLoad[index];
            filesToLoad[index] = "../../src/Shaders/" + filesToLoad[index] + ".fx";
        }
    }

    return filesToLoad;
}

/*
 * Shader Management.
 */
function shadersName(filename) {
    return path.basename(filename)
        .replace('.fragment', 'Pixel')
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
    var filesToProcess = determineFilesToProcess("shaderIncludes");
    includeShadersStream = gulp.src(filesToProcess).
        pipe(expect.real({ errorOnFailure: true }, filesToProcess)).
        pipe(uncommentShader()).
        pipe(srcToVariable({
            variableName: "BABYLON.Effect.IncludesShadersStore", asMap: true, namingCallback: includeShadersName
        }));
    cb();
});

gulp.task("shaders", ["includeShaders"], function (cb) {
    var filesToProcess = determineFilesToProcess("shaders");
    shadersStream = gulp.src(filesToProcess).
        pipe(expect.real({ errorOnFailure: true }, filesToProcess)).
        pipe(uncommentShader()).
        pipe(srcToVariable({
            variableName: "BABYLON.Effect.ShadersStore", asMap: true, namingCallback: shadersName
        }));
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

/**
 * Build tasks to concat minify uflify optimise the BJS js in different flavor (workers...).
 */
gulp.task("buildWorker", ["workers", "shaders"], function () {
    var filesToProcess = determineFilesToProcess("files");
    return merge2(
        gulp.src(filesToProcess).
            pipe(expect.real({ errorOnFailure: true }, filesToProcess)),
        shadersStream,
        includeShadersStream,
        workersStream
    )
        .pipe(concat(config.build.minWorkerFilename))
        .pipe(cleants())
        .pipe(replace(extendsSearchRegex, ""))
        .pipe(replace(decorateSearchRegex, ""))
        .pipe(addModuleExports("BABYLON"))
        .pipe(uglify())
        .pipe(optimisejs())
        .pipe(gulp.dest(config.build.outputDirectory));
});

gulp.task("build", ["shaders"], function () {
    var filesToProcess = determineFilesToProcess("files");
    return merge2(
        gulp.src(filesToProcess).
            pipe(expect.real({ errorOnFailure: true }, filesToProcess)),
        shadersStream,
        includeShadersStream
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

/*
* Compiles all typescript files and creating a js and a declaration file.
*/
gulp.task('typescript-compile', function () {
    var tsResult = gulp.src(config.typescript)
        .pipe(sourcemaps.init())
        .pipe(tsProject());

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
        tsResult.dts
            .pipe(concat(config.build.declarationModuleFilename))
            .pipe(addDtsExport("BABYLON"))
            .pipe(gulp.dest(config.build.outputDirectory)),
        tsResult.js
            .pipe(sourcemaps.write("./",
                {
                    includeContent: false,
                    sourceRoot: (filePath) => {
                        return '';
                    }
                }))
            .pipe(gulp.dest(config.build.srcOutputDirectory))
    ])
});

/**
 * Helper methods to build external library (mat, post processes, ...).
 */
var buildExternalLibraries = function (settings) {
    var tasks = settings.libraries.map(function (library) {
        return buildExternalLibrary(library, settings, false);
    });

    return merge2(tasks);
}

var buildExternalLibrary = function (library, settings, watch) {
    var tsProcess = gulp.src(library.files, { base: settings.build.srcOutputDirectory })
        .pipe(sourcemaps.init())
        .pipe(typescript(externalTsConfig));

    var shader = gulp.src(library.shaderFiles || [], { base: settings.build.srcOutputDirectory })
        .pipe(uncommentShader())
        .pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", shadersName, library.output + '.fx'))
        .pipe(gulp.dest(settings.build.srcOutputDirectory));

    var dev = tsProcess.js.pipe(sourcemaps.write("./", {
        includeContent: false,
        sourceRoot: (filePath) => {
            return '';
        }
    }))
        .pipe(gulp.dest(settings.build.srcOutputDirectory));

    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;
    var css = gulp.src(library.sassFiles || [])
        .pipe(sass().on('error', sass.logError))
        .pipe(concat(library.output.replace(".js", ".css")))
        .pipe(gulp.dest(outputDirectory));

    if (watch) {
        return merge2([shader, dev, css]);
    }
    else {
        var code = merge2([tsProcess.js, shader])
            .pipe(concat(library.output))
            .pipe(gulp.dest(outputDirectory))
            .pipe(cleants())
            .pipe(replace(extendsSearchRegex, ""))
            .pipe(replace(decorateSearchRegex, ""))
            .pipe(rename({ extname: ".min.js" }))
            .pipe(uglify())
            .pipe(optimisejs())
            .pipe(gulp.dest(outputDirectory));

        var dts = tsProcess.dts
            .pipe(concat(library.output))
            .pipe(rename({ extname: ".d.ts" }))
            .pipe(gulp.dest(outputDirectory));

        var waitAll = merge2([dev, code, css, dts]);

        if (library.webpack) {
            return waitAll.on('end', function () {
                webpack(require(library.webpack))
                    .pipe(rename(library.output.replace(".js", ".bundle.js")))
                    .pipe(gulp.dest(outputDirectory))
            });
        }
        else {
            return waitAll;
        }
    }
}

/**
 * The default task, concat and min the main BJS files.
 */
gulp.task("default", function (cb) {
    runSequence("buildWorker", "build", cb);
});

/**
 * Build the releasable files.
 */
gulp.task("typescript", function (cb) {
    runSequence("typescript-compile", "default", cb);
});

/**
 * Dynamic module creation.
 */
config.modules.map(function (module) {
    gulp.task(module, function () {
        return buildExternalLibraries(config[module]);
    });
});

gulp.task("typescript-libraries", config.modules, function () {
});

/**
 * Dynamic custom configurations.
 */
config.buildConfigurations.distributed.map(function (customConfiguration) {
    gulp.task(customConfiguration, function (cb) {
        config.build.currentConfig = customConfiguration;
        config.build.outputDirectory = config.build.outputCustomConfigurationsDirectory + "/" + customConfiguration;
        runSequence("typescript-compile", "build", cb);
    });
});

gulp.task("typescript-customConfigurations", function (cb) {
    runSequence(config.buildConfigurations.distributed, cb);
});

/**
 * Do it all.
 */
gulp.task("typescript-all", function (cb) {
    runSequence("typescript", "typescript-libraries", cb);
});

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task('watch', [], function () {
    var tasks = [gulp.watch(config.typescript, ['typescript-compile'])];

    config.modules.map(function (module) {
        config[module].libraries.map(function (library) {
            tasks.push(gulp.watch(library.files, function () {
                console.log(library.output);
                return buildExternalLibrary(library, config[module], true)
                    .pipe(debug());
            }));
            tasks.push(gulp.watch(library.shaderFiles, function () {
                console.log(library.output);
                return buildExternalLibrary(library, config[module], true)
                    .pipe(debug())
            }));
            tasks.push(gulp.watch(library.sassFiles, function () {
                console.log(library.output);
                return buildExternalLibrary(library, config[module], true)
                    .pipe(debug())
            }));
        });
    });

    return tasks;
});

/**
 * Embedded local dev env management.
 */
gulp.task('deployLocalDev', function () {
    gulp.src('../../localDev/template/**.*')
        .pipe(gulp.dest('../../localDev/src/'));
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


gulp.task("zip-blender", function () {
    return gulp.src('../../Exporters/Blender/src/**')
        .pipe(zip('Blender2Babylon-5.3.zip'))
        .pipe(gulp.dest('../../Exporters/Blender'));
});

gulp.task('clean-JS-MAP', function () {
    return del([
        '../../src/**/*.js.map', '../../src/**/*.js'
    ], { force: true });
});
