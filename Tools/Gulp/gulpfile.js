var gulp = require("gulp");
var uglify = require("gulp-uglify");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var srcToVariable = require("gulp-content-to-variable");
var appendSrcToVariable = require("./gulp-appendSrcToVariable");
var addDtsExport = require("./gulp-addDtsExport");
var addDecorateAndExtends = require("./gulp-decorateAndExtends");
var addModuleExports = require("./gulp-addModuleExports");
var addES6Exports = require("./gulp-addES6Exports");
var babylonModuleExports = require("./gulp-babylonModule");
var babylonES6ModuleExports = require("./gulp-es6ModuleExports");
var dtsModuleSupport = require("./gulp-dtsModuleSupport");
let calculateDependencies = require("./gulp-calculateDependencies");
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
var typedoc = require("gulp-typedoc");
var validateTypedoc = require("./gulp-validateTypedoc");
var request = require('request');
var fs = require("fs");
var dtsBundle = require('dts-bundle');
const through = require('through2');
var karmaServer = require('karma').Server;

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
    strictNullChecks: true,
    strictFunctionTypes: true,
    types: [],
    lib: [
        "dom",
        "es2015.promise",
        "es5"
    ]
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
    strictNullChecks: true,
    types: [],
    lib: [
        "dom",
        "es2015.promise",
        "es5"
    ]
};

var minimist = require("minimist");
var commandLineOptions = minimist(process.argv.slice(2), {
    boolean: "public"
});

function processDependency(kind, dependency, filesToLoad, firstLevelOnly) {
    if (!firstLevelOnly && dependency.dependUpon) {
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
        .pipe(addDecorateAndExtends())
        .pipe(addModuleExports("BABYLON", {
            dependencies: config.build.dependencies
        }))
        .pipe(uglify())
        .pipe(optimisejs())
        .pipe(gulp.dest(config.build.outputDirectory));
});

gulp.task("build", ["shaders"], function () {
    var filesToProcess = determineFilesToProcess("files");
    var directFilesToProcess = determineFilesToProcess("directFiles");
    let mergedStreams = merge2(
        gulp.src(filesToProcess).
            pipe(expect.real({ errorOnFailure: true }, filesToProcess)),
        shadersStream,
        includeShadersStream,
        gulp.src(directFilesToProcess)
    )
    return merge2(
        mergedStreams
            .pipe(concat(config.build.noModuleFilename))
            .pipe(cleants())
            .pipe(replace(extendsSearchRegex, ""))
            .pipe(replace(decorateSearchRegex, ""))
            .pipe(addDecorateAndExtends())
            .pipe(gulp.dest(config.build.outputDirectory))
            .pipe(rename(config.build.filename))
            .pipe(addModuleExports("BABYLON", {
                dependencies: config.build.dependencies
            }))
            .pipe(gulp.dest(config.build.outputDirectory))
            .pipe(rename(config.build.minFilename))
            .pipe(uglify())
            .pipe(optimisejs())
            .pipe(gulp.dest(config.build.outputDirectory)),
        mergedStreams
            .pipe(concat("es6.js"))
            .pipe(cleants())
            .pipe(replace(extendsSearchRegex, ""))
            .pipe(replace(decorateSearchRegex, ""))
            .pipe(addES6Exports("BABYLON"))
            .pipe(gulp.dest(config.build.outputDirectory))
    );
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
        tsResult.once("error", function () {
            tsResult.once("finish", function () {
                console.log("Typescript compile failed");
                process.exit(1);
            });
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
                .pipe(addDecorateAndExtends())
                .pipe(addModuleExports(settings.build.moduleDeclaration, { subModule: true, extendsRoot: settings.build.extendsRoot }))
                .pipe(gulp.dest(outputDirectory))
                .pipe(cleants())
                .pipe(rename({ extname: ".min.js" }))
                .pipe(uglify())
                .pipe(optimisejs())
                .pipe(gulp.dest(outputDirectory));

            let dtsFiles = files.map(function (filename) {
                return filename.replace(".js", ".d.ts");
            });
            let dtsModuleTask = gulp.src(dtsFiles)
                .pipe(concat(settings.build.outputFilename + ".module.d.ts"))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(addDtsExport(settings.build.moduleDeclaration, settings.build.moduleName, true, settings.build.extendsRoot, settings.build.extraTypesDependencies))
                .pipe(gulp.dest(outputDirectory));
            let dtsTask = gulp.src(dtsFiles)
                .pipe(concat(settings.build.outputFilename + ".d.ts"))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(gulp.dest(outputDirectory));

            return merge2([srcTask, dtsTask, dtsModuleTask]);
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
                .pipe(addDecorateAndExtends())
                .pipe(addModuleExports(library.moduleDeclaration, { subModule: true, extendsRoot: library.extendsRoot }))
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
                .pipe(addDtsExport(library.moduleDeclaration, library.moduleName, true, library.extendsRoot, config.build.extraTypesDependencies))
                .pipe(rename({ extname: ".module.d.ts" }))
                .pipe(gulp.dest(outputDirectory));
            waitAll = merge2([dev, code, css, dts, dts2]);
        } else {
            waitAll = merge2([dev, code, css, dts]);
        }

        if (library.webpack) {
            let sequence = [waitAll];
            let wpBuild = webpack(require(library.webpack));
            if (settings.build.outputs) {
                //shoud dtsBundle create the declaration?
                if (settings.build.dtsBundle) {
                    let event = wpBuild
                        .pipe(through.obj(function (file, enc, cb) {
                            // only declaration files
                            const isdts = /\.d\.ts$/.test(file.path);
                            if (isdts) this.push(file);
                            cb();
                        }))
                        .pipe(gulp.dest('.'));
                    // dts-bundle does NOT support (gulp) streams, so files have to be saved and reloaded, 
                    // until I fix it
                    event.on("end", function () {
                        // create the file
                        dtsBundle.bundle(settings.build.dtsBundle);
                        // prepend the needed reference
                        fs.readFile(settings.build.dtsBundle.out, function (err, data) {
                            if (err) throw err;
                            data = settings.build.dtsBundle.prependText + '\n' + data.toString();
                            fs.writeFile(settings.build.dtsBundle.out, data);
                        });
                    });
                }

                let build = wpBuild
                    .pipe(through.obj(function (file, enc, cb) {
                        // only pipe js files
                        const isJs = /\.js$/.test(file.path);
                        if (isJs) this.push(file);
                        cb();
                    }))
                    .pipe(addModuleExports(library.moduleDeclaration, { subModule: false, extendsRoot: false, externalUsingBabylon: true, noBabylonInit: library.babylonIncluded }));

                let unminifiedOutpus = [];
                let minifiedOutputs = [];
                settings.build.outputs.forEach(out => {
                    if (out.minified) {
                        out.destination.forEach(dest => {
                            minifiedOutputs.push(dest);
                        });
                    } else {
                        out.destination.forEach(dest => {
                            unminifiedOutpus.push(dest);
                        });
                    }
                });

                function processDestination(dest) {
                    var outputDirectory = config.build.outputDirectory + dest.outputDirectory;
                    build = build
                        .pipe(rename(dest.filename.replace(".js", library.noBundleInName ? '.js' : ".bundle.js")))
                        .pipe(gulp.dest(outputDirectory));

                    if (library.babylonIncluded && dest.addBabylonDeclaration) {
                        // include the babylon declaration
                        sequence.unshift(gulp.src(config.build.outputDirectory + '/' + config.build.declarationFilename)
                            .pipe(gulp.dest(outputDirectory)))
                    }
                }

                unminifiedOutpus.forEach(dest => {
                    processDestination(dest);
                });

                if (minifiedOutputs.length) {
                    build = build
                        .pipe(uglify())
                        .pipe(optimisejs())
                }

                minifiedOutputs.forEach(dest => {
                    processDestination(dest);
                });

                sequence.push(build);

            } else {
                sequence.push(
                    wpBuild
                        .pipe(rename(library.output.replace(".js", library.noBundleInName ? '.js' : ".bundle.js")))
                        .pipe(addModuleExports(library.moduleDeclaration, { subModule: false, extendsRoot: library.extendsRoot, externalUsingBabylon: true }))
                        .pipe(uglify())
                        .pipe(optimisejs())
                        .pipe(gulp.dest(outputDirectory))
                )
            }

            return merge2(sequence);
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
    runSequence("typescript-all", "intellisense", "typedoc-all", "tests-unit", "tests-validation-virtualscreen", "tests-validation-browserstack", cb);
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
 * Custom build with full path file control; used by profile.html
 */
gulp.task("build-custom", function (cb) {
    runSequence("typescript-compile", "build", cb);
});

/**
 * Do it all.
 */
gulp.task("typescript-all", function (cb) {
    runSequence("typescript", "typescript-libraries", cb);
});

/**
 * Watch ts files from typescript .
 */
gulp.task("srcTscWatch", function () {
    // Reuse The TSC CLI from gulp to enable -w.
    process.argv[2] = "-w";
    process.argv[3] = "-p";
    process.argv[4] = "../../src/tsconfig.json";
    require("./node_modules/typescript/lib/tsc.js");
});

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watch", ["srcTscWatch"], function () {
    var interval = 1000;

    var tasks = [];

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
        .pipe(replace(/^\s+_.*?;/gm, ""))
        .pipe(replace(/^\s+_[\S\s]*?}/gm, ""))
        .pipe(replace(/^\s*readonly _/gm, "protected readonly _"))
        .pipe(replace(/^\s*static _/gm, "private static _"))
        .pipe(replace(/^\s*abstract _/gm, ""))
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
        livereload: false,

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

/**
 * Cleans map and js files from the src folder.
 */
gulp.task("clean-JS-MAP", function () {
    return del([
        "../../src/**/*.js.map", "../../src/**/*.js"
    ], { force: true });
});

// this is needed for the modules for the declaration files.
gulp.task("modules-compile", function () {
    var tsResult = gulp.src(config.typescript)
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    // If this gulp task is running on travis
    if (process.env.TRAVIS) {
        tsResult.once("error", function () {
            tsResult.once("finish", function () {
                console.log("Typescript compile failed");
                process.exit(1);
            });
        });
    }

    return merge2([
        tsResult.dts
            .pipe(gulp.dest(config.build.srcOutputDirectory)),
        tsResult.js
            .pipe(sourcemaps.write("./",
                {
                    includeContent: false,
                    sourceRoot: (filePath) => {
                        return "";
                    }
                }))
            .pipe(gulp.dest(config.build.srcOutputDirectory))
    ]);
});

// this holds the declared objects in each module
let declared = {}
let perFile = {};
let dependencyTree = {};

gulp.task('prepare-for-modules', /*["modules-compile"],*/ function () {
    let tasks = [];
    Object.keys(config.workloads).forEach((moduleName) => {
        let dtsFiles = config.workloads[moduleName].files.map(f => f.replace(".js", ".d.ts"))
        let dtsTask = gulp.src(dtsFiles)
            .pipe(dtsModuleSupport(moduleName, false, declared, perFile));

        tasks.push(dtsTask);
    });

    // now calculate internal dependencies in the .ts files!
    /*Object.keys(config.workloads).forEach((moduleName) => {
        let tsFiles = config.workloads[moduleName].files.map(f => f.replace(".js", ".ts"))
        let depTask = gulp.src(tsFiles)
            .pipe(calculateDependencies(moduleName, perFile, dependencyTree));

        tasks.push(depTask);
    });*/

    return merge2(tasks);
});

gulp.task('prepare-dependency-tree', ["prepare-for-modules"], function () {
    let tasks = [];

    // now calculate internal dependencies in the .ts files!
    Object.keys(config.workloads).forEach((moduleName) => {
        let tsFiles = config.workloads[moduleName].files.map(f => f.replace(".js", ".ts"))
        let depTask = gulp.src(tsFiles)
            .pipe(calculateDependencies(moduleName, perFile, declared, dependencyTree));

        tasks.push(depTask);
    });

    return merge2(tasks);
});

// generate the modules directory, along with commonjs modules and es6 modules
// Note - the generated modules are UNMINIFIED! The user will choose whether they want to minify or not.
gulp.task("modules", ["prepare-dependency-tree"], function () {
    let tasks = [];

    Object.keys(config.workloads)
        .forEach((moduleName) => {
            let shadersFiles = [];
            processDependency("shaders", config.workloads[moduleName], shadersFiles, true);
            for (var index = 0; index < shadersFiles.length; index++) {
                shadersFiles[index] = "../../src/Shaders/" + shadersFiles[index] + ".fx";
            }

            let shaderIncludeFiles = [];
            processDependency("shaderIncludes", config.workloads[moduleName], shaderIncludeFiles, true);
            for (var index = 0; index < shaderIncludeFiles.length; index++) {
                shaderIncludeFiles[index] = "../../src/Shaders/ShadersInclude/" + shaderIncludeFiles[index] + ".fx";
            }

            let commonJsTask = merge2([
                gulp.src(config.workloads[moduleName].files)
                    .pipe(replace(extendsSearchRegex, ""))
                    .pipe(replace(decorateSearchRegex, ""))
                    .pipe(replace(referenceSearchRegex, ""))
                    .pipe(replace(/var BABYLON;\n/g, ""))
                    .pipe(babylonModuleExports(moduleName, dependencyTree, false, perFile, shadersFiles.length, shaderIncludeFiles.length))
                    .pipe(rename(function (path) {
                        path.basename = path.basename.split(".").pop()
                        path.extname = ".js"
                    })),
                gulp.src(shadersFiles)
                    .pipe(expect.real({ errorOnFailure: true }, shadersFiles))
                    .pipe(uncommentShader())
                    .pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", shadersName, config.build.outputDirectory + '/commonjs/' + moduleName + ".fx", "commonjs"))
                    .pipe(rename("shaders.js")),
                gulp.src(shaderIncludeFiles)
                    .pipe(expect.real({ errorOnFailure: true }, shaderIncludeFiles))
                    .pipe(uncommentShader())
                    .pipe(appendSrcToVariable("BABYLON.Effect.IncludesShadersStore", includeShadersName, config.build.outputDirectory + '/commonjs/' + moduleName + ".include.fx", "commonjs"))
                    .pipe(rename("shaderIncludes.js")),
                gulp.src(config.workloads[moduleName].files)
                    .pipe(concat('index.js'))
                    .pipe(babylonModuleExports(moduleName, dependencyTree, true, perFile))

            ]).pipe(gulp.dest(config.build.outputDirectory + '/modules/' + moduleName + '/'))

            let es6Tasks = merge2([
                gulp.src(config.workloads[moduleName].files)
                    .pipe(replace(extendsSearchRegex, ""))
                    .pipe(replace(decorateSearchRegex, ""))
                    .pipe(replace(referenceSearchRegex, ""))
                    .pipe(replace(/var BABYLON;\n/g, ""))
                    .pipe(babylonES6ModuleExports(moduleName, dependencyTree, false, perFile, shadersFiles.length, shaderIncludeFiles.length))
                    .pipe(rename(function (path) {
                        path.basename = path.basename.split(".").pop()
                        path.extname = ".js"
                    })),
                gulp.src(shadersFiles)
                    .pipe(expect.real({ errorOnFailure: true }, shadersFiles))
                    .pipe(uncommentShader())
                    .pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", shadersName, config.build.outputDirectory + '/es6/' + moduleName + ".fx", "es6"))
                    .pipe(rename("shaders.js")),
                gulp.src(shaderIncludeFiles)
                    .pipe(expect.real({ errorOnFailure: true }, shaderIncludeFiles))
                    .pipe(uncommentShader())
                    .pipe(appendSrcToVariable("BABYLON.Effect.IncludesShadersStore", includeShadersName, config.build.outputDirectory + '/es6/' + moduleName + ".include.fx", "es6"))
                    .pipe(rename("shaderIncludes.js")),
                gulp.src(config.workloads[moduleName].files)
                    .pipe(concat('index.js'))
                    .pipe(babylonES6ModuleExports(moduleName, dependencyTree, true, perFile))

            ]).pipe(gulp.dest(config.build.outputDirectory + '/modules/' + moduleName + '/es6/'))

            //commonjs js generation task
            /*let jsTask = merge2([
                gulp.src(config.workloads[moduleName].files),
                gulp.src(shadersFiles).
                    //pipe(expect.real({ errorOnFailure: true }, shadersFiles)).
                    pipe(uncommentShader()).
                    pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", shadersName, config.build.outputDirectory + '/commonjs/' + moduleName + ".fx", true)),
                gulp.src(shaderIncludeFiles).
                    //pipe(expect.real({ errorOnFailure: true }, shaderIncludeFiles)).
                    pipe(uncommentShader()).
                    pipe(appendSrcToVariable("BABYLON.Effect.IncludesShadersStore", includeShadersName, config.build.outputDirectory + '/commonjs/' + moduleName + ".include.fx", true))
            ]).pipe(concat('index.js'))
                .pipe(replace(extendsSearchRegex, ""))
                .pipe(replace(decorateSearchRegex, ""))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(babylonModuleExports(moduleName, config.workloads[moduleName].dependUpon))
                .pipe(gulp.dest(config.build.outputDirectory + '/modules/' + moduleName + '/'));*/


            // es6 modules generation task
            /*let es6Task = merge2([
                gulp.src(config.workloads[moduleName].files),
                gulp.src(shadersFiles).
                    //pipe(expect.real({ errorOnFailure: true }, shadersFiles)).
                    pipe(uncommentShader()).
                    pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", shadersName, config.build.outputDirectory + '/commonjs/' + moduleName + ".fx", true)),
                gulp.src(shaderIncludeFiles).
                    //pipe(expect.real({ errorOnFailure: true }, shaderIncludeFiles)).
                    pipe(uncommentShader()).
                    pipe(appendSrcToVariable("BABYLON.Effect.IncludesShadersStore", includeShadersName, config.build.outputDirectory + '/commonjs/' + moduleName + ".include.fx", true))
            ]).pipe(concat('es6.js'))
                .pipe(replace(extendsSearchRegex, ""))
                .pipe(replace(decorateSearchRegex, ""))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(replace(/var BABYLON;/g, ""))
                .pipe(babylonES6ModuleExports(moduleName, config.workloads[moduleName].dependUpon))
                .pipe(gulp.dest(config.build.outputDirectory + '/modules/' + moduleName + '/'));

            // dts genration task
            let dtsFiles = config.workloads[moduleName].files.map(f => f.replace(".js", ".d.ts"))
            let dtsTask = gulp.src(dtsFiles)
                .pipe(concat("index.d.ts"))
                .pipe(replace(/declare module BABYLON {/g, `declare module 'babylonjs/${moduleName}' {`))
                .pipe(replace(/\ninterface /g, `\nexport interface `))
                .pipe(dtsModuleSupport(moduleName, true, declared, perFile, dependencyTree))
                .pipe(gulp.dest(config.build.outputDirectory + '/modules/' + moduleName + '/'));
*/
            tasks.push(commonJsTask, es6Tasks);
        });

    // run da tasks man!
    return merge2(tasks);
})

/**
 * Generate the TypeDoc JSON output in order to create code metadata.
 */
gulp.task("typedoc-generate", function () {
    return gulp
        .src(["../../dist/preview release/babylon.d.ts", "../../dist/preview release/loaders/babylon.glTF2FileLoader.d.ts", "../../dist/preview release/gltf2Interface/babylon.glTF2Interface.d.ts"])
        .pipe(typedoc({
            // TypeScript options (see typescript docs)
            mode: "modules",
            module: "commonjs",
            target: "es5",
            includeDeclarations: true,

            // Output options (see typedoc docs)
            json: config.build.typedocJSON,

            // TypeDoc options (see typedoc docs)
            ignoreCompilerErrors: true,

            readme: "none",

            excludeExternals: true,
            excludePrivate: true,
            excludeProtected: true,

            entryPoint: ["\"babylon.d\"", "BABYLON"]
        }));
});

/**
 * Validate the TypeDoc JSON output against the current baselin to ensure our code is correctly documented.
 * (in the newly introduced areas)
 */
gulp.task("typedoc-validate", function () {
    return gulp.src(config.build.typedocJSON)
        .pipe(validateTypedoc(config.build.typedocValidationBaseline, "BABYLON", true, false));
});

/**
 * Generate the validation reference to ensure our code is correctly documented.
 */
gulp.task("typedoc-generateValidationBaseline", function () {
    return gulp.src(config.build.typedocJSON)
        .pipe(validateTypedoc(config.build.typedocValidationBaseline, "BABYLON", true, true));
});

/**
 * Validate the code comments and style case convention through typedoc and
 * generate the new baseline.
 */
gulp.task("typedoc-all", function (cb) {
    runSequence("typedoc-generate", "typedoc-validate", "typedoc-generateValidationBaseline", cb);
});


/**
 * Validate compile the code and check the comments and style case convention through typedoc
 */
gulp.task("typedoc-check", function (cb) {
    runSequence("typescript-compile", "typedoc-generate", "typedoc-validate", cb);
});

/**
 * Launches the KARMA validation tests in chrome in order to debug them.
 * (Can only be launch locally.)
 */
gulp.task("tests-validation-karma", function (done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../tests/validation/karma.conf.js",
        singleRun: false
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Launches the KARMA validation tests in ff or virtual screen ff on travis for a quick analysis during the build.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-validation-virtualscreen", function (done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../tests/validation/karma.conf.js",
        singleRun: true,
        browsers: ['Firefox']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Launches the KARMA validation tests in browser stack for remote and cross devices validation tests.
 * (Can only be launch from secure branches.)
 */
gulp.task("tests-validation-browserstack", function (done) {
    if (!process.env.BROWSER_STACK_USERNAME) {
        done();
        return;
    }

    var kamaServerOptions = {
        configFile: __dirname + "/../../tests/validation/karma.conf.browserstack.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Transpiles typescript unit tests. 
 */
gulp.task("tests-unit-transpile", function (done) {
    var tsProject = typescript.createProject('../../tests/unit/tsconfig.json');

    var tsResult = gulp.src("../../tests/unit/**/*.ts", { base: "../../" })
        .pipe(tsProject());

    tsResult.once("error", function () {
        tsResult.once("finish", function () {
            console.log("Typescript compile failed");
            process.exit(1);
        });
    });

    return tsResult.js.pipe(gulp.dest("../../"));
});

/**
 * Launches the KARMA unit tests in phantomJS.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-unit-debug", ["tests-unit-transpile"], function (done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../tests/unit/karma.conf.js",
        singleRun: false,
        browsers: ['Chrome']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Launches the KARMA unit tests in phantomJS.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-unit", ["tests-unit-transpile"], function (done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../tests/unit/karma.conf.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

var rmDir = function (dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch (e) { return; }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                rmDir(filePath);
        }
    fs.rmdirSync(dirPath);
};

/**
 * Launches the viewer's KARMA validation tests in chrome in order to debug them.
 * (Can only be launch locally.)
 */
gulp.task("tests-viewer-validation-karma", function (done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/validation/karma.conf.js",
        singleRun: false
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Transpiles viewer typescript unit tests. 
 */
gulp.task("tests-viewer-unit-transpile", function (done) {

    let wpBuild = webpack(require('../../Viewer/tests/unit/webpack.config.js'));

    // clean the built directory
    rmDir("../../Viewer/tests/unit/build/");

    return wpBuild
        .pipe(gulp.dest("../../Viewer/tests/unit/build/"));
});

/**
 * Launches the KARMA unit tests in phantomJS.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-viewer-unit-debug", ["tests-viewer-unit-transpile"], function (done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/karma.conf.js",
        singleRun: false,
        browsers: ['Chrome']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Launches the KARMA unit tests in phantomJS.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-viewer-unit", ["tests-viewer-unit-transpile"], function (done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/karma.conf.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

gulp.task("tests-whatsnew", function (done) {
    // Only checks on Travis
    if (!process.env.TRAVIS) {
        done();
        return;
    }

    // Only checks on Pull Requests
    if (process.env.TRAVIS_PULL_REQUEST == "false") {
        done();
        return;
    }

    // Do not check deploy
    if (process.env.TRAVIS_BRANCH == "preview") {
        done();
        return;
    }

    // Compare what's new with the current one in the preview release folder.
    const https = require("https");
    const url = "https://rawgit.com/BabylonJS/Babylon.js/master/dist/preview%20release/what's%20new.md";
    https.get(url, res => {
        res.setEncoding("utf8");
        let oldData = "";
        res.on("data", data => {
            oldData += data;
        });
        res.on("end", () => {
            fs.readFile("../../dist/preview release/what's new.md", "utf-8", function (err, newData) {
                if (err || oldData != newData) {
                    done();
                    return;
                }

                console.error("What's new file did not change.");
                process.exit(1);
            });
        });
    });
});
