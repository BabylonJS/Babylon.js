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
var cleants = require("gulp-clean-ts-extends");
var changedInPlace = require("gulp-changed-in-place");
var runSequence = require("run-sequence");
var replace = require("gulp-replace");
var uncommentShader = require("./gulp-removeShaderComments");
var expect = require("gulp-expect-file");
var optimisejs = require("gulp-optimize-js");
var webserver = require("gulp-webserver");
var path = require("path");
var sass = require("gulp-sass");
var webpack = require("webpack-stream");

var config = require("./config.json");

var del = require("del");

var debug = require("gulp-debug");
var includeShadersStream;
var shadersStream;
var workersStream;

var extendsSearchRegex = /var\s__extends[\s\S]+?\}\)\(\);/g;
var decorateSearchRegex = /var\s__decorate[\s\S]+?\};/g;
var referenceSearchRegex = /\/\/\/ <reference.*/g;

/**
 * TS configurations shared in the gulp file.
 */
var tsConfig = {
    noResolve: true,
    target: "ES5",
    declarationFiles: true,
    typescript: require("typescript"),
    experimentalDecorators: true,
    isolatedModules: false,
    noImplicitAny: true,
    noImplicitReturns: true,
    noImplicitThis: true,
    noUnusedLocals: true,
    strictNullChecks: true
};
var tsProject = typescript.createProject(tsConfig);

var externalTsConfig = {
    noResolve: false,
    target: "ES5",
    declarationFiles: true,
    typescript: require("typescript"),
    experimentalDecorators: true,
    isolatedModules: false,
    noImplicitAny: true,
    noImplicitReturns: true,
    noImplicitThis: true,
    noUnusedLocals: true,
    strictNullChecks: true
};

var minimist = require("minimist");
var commandLineOptions = minimist(process.argv.slice(2), {
    boolean: "public"
});

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

        if (kind === "directFiles" && !dependency) {
            filesToLoad.push("../../dist/preview release/" + dependencyName);
        }
        else if (dependency) {
            processDependency(kind, dependency, filesToLoad);
        }
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
        .replace(".fragment", "Pixel")
        .replace(".vertex", "Vertex")
        .replace(".fx", "Shader");
}

function includeShadersName(filename) {
    return path.basename(filename).replace(".fx", "");
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
    var directFilesToProcess = determineFilesToProcess("directFiles");
    return merge2(
        gulp.src(filesToProcess).
            pipe(expect.real({ errorOnFailure: true }, filesToProcess)),
        shadersStream,
        includeShadersStream,
        gulp.src(directFilesToProcess)
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
gulp.task("typescript-compile", function () {
    var tsResult = gulp.src(config.typescript)
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    //If this gulp task is running on travis, file the build!
    if (process.env.TRAVIS) {
        var error = false;
        tsResult.on("error", function () {
            error = true;
        }).on("end", function () {
            if (error) {
                console.log("Typescript compile failed");
                process.exit(1);
            }
        });
    }

    return merge2([
        tsResult.dts
            .pipe(concat(config.build.declarationFilename))
            .pipe(addDtsExport("BABYLON", "babylonjs"))
            .pipe(gulp.dest(config.build.outputDirectory)),
        tsResult.js
            .pipe(sourcemaps.write("./",
                {
                    includeContent: false,
                    sourceRoot: (filePath) => {
                        return "";
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

    let mergedTasks = merge2(tasks);

    if (settings.build.buildAsModule) {
        mergedTasks.on("end", function () {
            //generate js file list
            let files = settings.libraries.filter(function (lib) {
                return !lib.doNotIncludeInBundle;
            }).map(function (lib) {
                return config.build.outputDirectory + settings.build.distOutputDirectory + lib.output;
            });

            var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

            let srcTask = gulp.src(files)
                .pipe(concat(settings.build.outputFilename + ".js"))
                .pipe(replace(extendsSearchRegex, ""))
                .pipe(replace(decorateSearchRegex, ""))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(addModuleExports(settings.build.moduleDeclaration, true, settings.build.extendsRoot))
                .pipe(gulp.dest(outputDirectory))
                .pipe(cleants())
                .pipe(rename({ extname: ".min.js" }))
                .pipe(uglify())
                .pipe(optimisejs())
                .pipe(gulp.dest(outputDirectory));

            let dtsFiles = files.map(function (filename) {
                return filename.replace(".js", ".d.ts");
            });

            let dtsTask = gulp.src(dtsFiles)
                .pipe(concat(settings.build.outputFilename + ".module.d.ts"))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(addDtsExport(settings.build.moduleDeclaration, settings.build.moduleName, true, settings.build.extendsRoot))
                .pipe(gulp.dest(outputDirectory));

            return merge2([srcTask, dtsTask]);
        });
    }

    return mergedTasks;
}

var buildExternalLibrary = function (library, settings, watch) {
    var tsProcess = gulp.src(library.files, { base: settings.build.srcOutputDirectory })
        .pipe(sourcemaps.init())
        .pipe(typescript(externalTsConfig));

    var includeShader = gulp.src(library.shadersIncludeFiles || [], { base: settings.build.srcOutputDirectory })
        .pipe(uncommentShader())
        .pipe(appendSrcToVariable("BABYLON.Effect.IncludesShadersStore", includeShadersName, library.output + ".include.fx"))
        .pipe(gulp.dest(settings.build.srcOutputDirectory));

    var shader = gulp.src(library.shaderFiles || [], { base: settings.build.srcOutputDirectory })
        .pipe(uncommentShader())
        .pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", shadersName, library.output + ".fx"))
        .pipe(gulp.dest(settings.build.srcOutputDirectory));

    var dev = tsProcess.js
        .pipe(sourcemaps.write("./", {
            includeContent: false,
            sourceRoot: (filePath) => {
                return "";
            }
        })).pipe(gulp.dest(settings.build.srcOutputDirectory));

    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;
    var css = gulp.src(library.sassFiles || [])
        .pipe(sass().on("error", sass.logError))
        .pipe(concat(library.output.replace(".js", ".css")))
        .pipe(gulp.dest(outputDirectory));

    if (watch) {
        return merge2([shader, includeShader, dev, css]);
    }
    else {
        /*if (library.bundle) {
            // Don't remove extends and decorate functions
            var code = merge2([tsProcess.js, shader, includeShader])
                .pipe(concat(library.output));

            if (library.buildAsModule) {
                code = code.pipe(addModuleExports(library.moduleDeclaration, true))
            }

            code.pipe(gulp.dest(outputDirectory))
                .pipe(cleants())
                .pipe(rename({ extname: ".min.js" }))
                .pipe(uglify())
                .pipe(optimisejs())
                .pipe(gulp.dest(outputDirectory));
        } else {*/
        var code = merge2([tsProcess.js, shader, includeShader])
            .pipe(concat(library.output))

        if (library.buildAsModule) {
            code = code.pipe(replace(extendsSearchRegex, ""))
                .pipe(replace(decorateSearchRegex, ""))
                .pipe(addModuleExports(library.moduleDeclaration, true, library.extendsRoot))
        }

        code = code.pipe(gulp.dest(outputDirectory))
            .pipe(cleants())
            .pipe(rename({ extname: ".min.js" }))
            .pipe(uglify())
            .pipe(optimisejs())
            .pipe(gulp.dest(outputDirectory));
        /*}*/

        var dts = tsProcess.dts
            .pipe(concat(library.output))
            .pipe(replace(referenceSearchRegex, ""))
            .pipe(rename({ extname: ".d.ts" }))
            .pipe(gulp.dest(outputDirectory));

        var waitAll;

        if (library.buildAsModule) {
            var dts2 = tsProcess.dts
                .pipe(concat(library.output))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(addDtsExport(library.moduleDeclaration, library.moduleName, true, library.extendsRoot))
                .pipe(rename({ extname: ".module.d.ts" }))
                .pipe(gulp.dest(outputDirectory));
            waitAll = merge2([dev, code, css, dts, dts2]);
        } else {
            waitAll = merge2([dev, code, css, dts]);
        }

        if (library.webpack) {
            return waitAll.on("end", function () {
                webpack(require(library.webpack))
                    .pipe(rename(library.output.replace(".js", ".bundle.js")))
                    .pipe(addModuleExports(library.moduleDeclaration, false, false, true))
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
    runSequence("typescript-all", "intellisense", cb);
});

gulp.task("mainBuild", function (cb) {
    runSequence("buildWorker", "build", cb);
});

/**
 * Build the releasable files.
 */
gulp.task("typescript", function (cb) {
    runSequence("typescript-compile", "mainBuild", cb);
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
 * Custom build with full path file control; used by profile.html
 */
gulp.task("build-custom", function (cb) {
    runSequence("typescript-compile", "build", cb);
});

/**
 * Do it all.
 */
gulp.task("typescript-all", function (cb) {
    runSequence("typescript", "typescript-libraries", "typescript-customConfigurations", cb);
});

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watch", [], function () {
    var interval = 1000;
    var tasks = [gulp.watch(config.typescript, { interval: interval }, ["typescript-compile"])];

    config.modules.map(function (module) {
        config[module].libraries.map(function (library) {
            tasks.push(gulp.watch(library.files, { interval: interval }, function () {
                console.log(library.output);
                return buildExternalLibrary(library, config[module], true)
                    .pipe(debug());
            }));
            tasks.push(gulp.watch(library.shaderFiles, { interval: interval }, function () {
                console.log(library.output);
                return buildExternalLibrary(library, config[module], true)
                    .pipe(debug())
            }));
            tasks.push(gulp.watch(library.sassFiles, { interval: interval }, function () {
                console.log(library.output);
                return buildExternalLibrary(library, config[module], true)
                    .pipe(debug())
            }));
        });
    });

    return tasks;
});

gulp.task("intellisense", function () {
    gulp.src(config.build.intellisenseSources)
        .pipe(concat(config.build.intellisenseFile))
        .pipe(replace(/^\s*_.*?$/gm, ""))
        .pipe(replace(/^\s*private .*?$/gm, ""))
        .pipe(replace(/^\s*public _.*?$/gm, ""))
        .pipe(replace(/^\s*protected .*?$/gm, ""))
        .pipe(replace(/^\s*public static _.*?$/gm, ""))
        .pipe(replace(/^\s*static _.*?$/gm, ""))
        .pipe(gulp.dest(config.build.playgroundDirectory));
});

/**
 * Embedded local dev env management.
 */
gulp.task("deployLocalDev", function () {
    gulp.src("../../localDev/template/**.*")
        .pipe(gulp.dest("../../localDev/src/"));
});

/**
 * Embedded webserver for test convenience.
 */
gulp.task("webserver", function () {
    var options = {
        port: 1338,
        livereload: false
    };

    if (commandLineOptions.public) {
        options.host = "0.0.0.0";
    }

    gulp.src("../../.").pipe(webserver(options));
});

/**
 * Combine Webserver and Watch as long as vscode does not handle multi tasks.
 */
gulp.task("run", ["watch", "webserver"], function () {
});

gulp.task("clean-JS-MAP", function () {
    return del([
        "../../src/**/*.js.map", "../../src/**/*.js"
    ], { force: true });
});
