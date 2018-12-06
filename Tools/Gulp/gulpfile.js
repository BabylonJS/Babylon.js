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
var replace = require("gulp-replace");
var uncommentShader = require("./gulp-removeShaderComments");
var expect = require("gulp-expect-file");
var optimisejs = require("gulp-optimize-js");
var connect = require("gulp-connect");
var path = require("path");
const webpack = require('webpack');
var webpackStream = require("webpack-stream");
var typedoc = require("gulp-typedoc");
var validateTypedoc = require("./gulp-validateTypedoc");
var fs = require("fs");
var dtsBundle = require('dts-bundle');
const through = require('through2');
var karmaServer = require('karma').Server;
var gulpTslint = require("gulp-tslint");
var tslint = require("tslint");
const filter = require('gulp-filter');
var cors = require('cors');

//viewer declaration
var processDeclaration = require('./processViewerDeclaration');

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
    boolean: ["public", "tsLintFix"]
});

var tsLintFix = commandLineOptions.tsLintFix

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
gulp.task("includeShaders", function(cb) {
    var filesToProcess = determineFilesToProcess("shaderIncludes");
    includeShadersStream = gulp.src(filesToProcess).
        pipe(expect.real({ errorOnFailure: true }, filesToProcess)).
        pipe(uncommentShader()).
        pipe(srcToVariable({
            variableName: "BABYLON.Effect.IncludesShadersStore", asMap: true, namingCallback: includeShadersName
        }));
    cb();
});

gulp.task("shaders", gulp.series("includeShaders", function(cb) {
    var filesToProcess = determineFilesToProcess("shaders");
    shadersStream = gulp.src(filesToProcess).
        pipe(expect.real({ errorOnFailure: true }, filesToProcess)).
        pipe(uncommentShader()).
        pipe(srcToVariable({
            variableName: "BABYLON.Effect.ShadersStore", asMap: true, namingCallback: shadersName
        }));
    cb();
}));

gulp.task("workers", function(cb) {
    workersStream = config.workers.map(function(workerDef) {
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
gulp.task("buildWorker", gulp.series(gulp.parallel("workers", "shaders"), function() {
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
}));

gulp.task("build", gulp.series("shaders", function build() {
    var filesToProcess = determineFilesToProcess("files");
    var directFilesToProcess = determineFilesToProcess("directFiles");
    let mergedStreams = merge2(gulp.src(filesToProcess)
        .pipe(expect.real({ errorOnFailure: true }, filesToProcess)),
        shadersStream,
        includeShadersStream);
    if (directFilesToProcess.length) {
        mergedStreams.add(gulp.src(directFilesToProcess));
    }
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
}));

/*
* TsLint all typescript files from the src directory.
*/
gulp.task("typescript-tsLint", function() {
    const dtsFilter = filter(['**', '!**/*.d.ts'], { restore: false });
    return gulp.src(config.typescript)
        .pipe(dtsFilter)
        .pipe(gulpTslint({
            formatter: "stylish",
            configuration: "../../tslint.json",
            fix: tsLintFix
        }))
        .pipe(gulpTslint.report());
});

/*
* TsLint all typescript files from the src directory.
*/
var tsLintExternalLibrary = function(library, settings, watch) {
    if (library.files && library.files.length) {
        return gulp.src(library.files, { base: settings.build.srcOutputDirectory })
            .pipe(gulpTslint({
                formatter: "stylish",
                configuration: "../../tslint.json",
                fix: tsLintFix
            }))
            .pipe(gulpTslint.report());
    }
    else {
        return gulp.src((settings.build.srcDirectory || settings.build.srcOutputDirectory) + "/**/*.ts")
            .pipe(gulpTslint({
                formatter: "stylish",
                configuration: "../../tslint.json",
                fix: tsLintFix
            }))
            .pipe(gulpTslint.report());
    }
}

/**
 * Helper methods to tsLint external library (mat, post processes, ...).
 */
var tsLintExternalLibraries = function(settings) {
    var tasks = settings.libraries.map(function(library) {
        return tsLintExternalLibrary(library, settings, false);
    });

    let mergedTasks = merge2(tasks);
    return mergedTasks;
}

/**
 * Dynamic module creation tsLint.
 */
config.modules.map(function(module) {
    gulp.task(module + "-tsLint", function() {
        return tsLintExternalLibraries(config[module]);
    });
});

/**
 * Full Librairies tsLint.
 */
gulp.task("typescript-libraries-tsLint",
    gulp.series(config.modules.map((module) => {
        return module + "-tsLint";
    })
    ));

/**
 * Full TsLint.
 */
gulp.task("tsLint", gulp.series("typescript-tsLint", "typescript-libraries-tsLint"));

/*
* Compiles all typescript files and creating a js and a declaration file.
*/
gulp.task("typescript-compile", function() {
    const dtsFilter = filter(['**', '!**/*.d.ts'], { restore: false });
    var tsResult = gulp.src(config.typescript)
        .pipe(dtsFilter)
        .pipe(sourcemaps.init())
        .pipe(tsProject({
            summarizeFailureOutput: true
        }));

    tsResult.once("error", function(err) {
        tsResult.once("finish", function() {
            console.log("Typescript compile failed");
            console.error(err);
            process.exit(1);
        });
    });

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
var buildExternalLibraries = function(settings) {
    var tasks = settings.libraries.map(function(library) {
        return buildExternalLibrary(library, settings, false);
    });

    let mergedTasks = merge2(tasks);

    if (settings.build.buildAsModule) {
        mergedTasks.on("end", function() {
            //generate js file list
            let files = settings.libraries.filter(function(lib) {
                return !lib.doNotIncludeInBundle;
            }).map(function(lib) {
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

            let dtsFiles = files.map(function(filename) {
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

var buildExternalLibrary = function(library, settings, watch) {
    var tsProcess;
    if (library.files && library.files.length) {
        tsProcess = gulp.src(library.files, { base: settings.build.srcOutputDirectory })
            .pipe(sourcemaps.init())
            .pipe(typescript(externalTsConfig));
    }

    let tasks = [];

    let shaderTask;

    let shadersIndlueTask;

    if (library.shadersIncludeFiles && library.shadersIncludeFiles.length) {
        shadersIndlueTask = gulp.src(library.shadersIncludeFiles, { base: settings.build.srcOutputDirectory })
            .pipe(uncommentShader())
            .pipe(appendSrcToVariable("BABYLON.Effect.IncludesShadersStore", includeShadersName, library.output + ".include.fx"))
            .pipe(gulp.dest(settings.build.srcOutputDirectory));
        tasks.push(shadersIndlueTask);
    }

    if (library.shaderFiles && library.shaderFiles.length) {
        shaderTask = gulp.src(library.shaderFiles, { base: settings.build.srcOutputDirectory })
            .pipe(uncommentShader())
            .pipe(appendSrcToVariable("BABYLON.Effect.ShadersStore", shadersName, library.output + ".fx"))
            .pipe(gulp.dest(settings.build.srcOutputDirectory));
        tasks.push(shaderTask);
    }

    var dev;

    if (tsProcess) {
        dev = tsProcess.js
            .pipe(sourcemaps.write("./", {
                includeContent: false,
                sourceRoot: (filePath) => {
                    return "";
                }
            })).pipe(gulp.dest(settings.build.srcOutputDirectory));

        tasks.push(dev);
    }

    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

    /*let cssTask;

    if (library.sassFiles && library.sassFiles.length) {
        cssTask = gulp.src(library.sassFiles)
            .pipe(sass().on("error", sass.logError))
            .pipe(concat(library.output.replace(".js", ".css")))
            .pipe(gulp.dest(outputDirectory));
        tasks.push(cssTask);
    }*/


    if (watch) {
        return merge2(tasks);
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
        let currentTasks = [];
        if (tsProcess) {
            currentTasks.push(tsProcess.js);
        }
        if (shaderTask) {
            currentTasks.push(shaderTask);
        }
        if (shadersIndlueTask) {
            currentTasks.push(shadersIndlueTask);
        }
        var code;

        if (currentTasks.length) {
            code = merge2(currentTasks)
                .pipe(concat(library.output));
        }

        if (library.buildAsModule && code) {
            code = code.pipe(replace(extendsSearchRegex, ""))
                .pipe(replace(decorateSearchRegex, ""))
                .pipe(addDecorateAndExtends())
                .pipe(addModuleExports(library.moduleDeclaration, { subModule: true, extendsRoot: library.extendsRoot }))
        }

        if (code) {

            code = code.pipe(gulp.dest(outputDirectory))
                .pipe(cleants())
                .pipe(rename({ extname: ".min.js" }))
                .pipe(uglify())
                .pipe(optimisejs())
                .pipe(gulp.dest(outputDirectory));
            /*}*/

        }

        var dts;

        if (tsProcess) {
            dts = tsProcess.dts
                .pipe(concat(library.output))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(rename({ extname: ".d.ts" }))
                .pipe(gulp.dest(outputDirectory));
        }

        var waitAll;
        let waitAllTasks = [];
        /*if (cssTask) {
            waitAllTasks.push(cssTask);
        }*/

        if (dev) {
            waitAllTasks.push(dev);
        }

        if (code) {
            waitAllTasks.push(code);
        }

        if (dts) {
            waitAllTasks.push(dts);
        }

        if (library.buildAsModule && tsProcess) {
            var dts2 = tsProcess.dts
                .pipe(concat(library.output))
                .pipe(replace(referenceSearchRegex, ""))
                .pipe(addDtsExport(library.moduleDeclaration, library.moduleName, true, library.extendsRoot, config.build.extraTypesDependencies))
                .pipe(rename({ extname: ".module.d.ts" }))
                .pipe(gulp.dest(outputDirectory));
            waitAllTasks.push(dts2);
        }
        if (waitAllTasks.length) {
            waitAll = merge2(waitAllTasks);
        }

        if (library.webpack) {
            let sequence = [];
            if (waitAll) {
                sequence.push(waitAll);
            }

            if (settings.build.outputs) {

                settings.build.outputs.forEach(out => {
                    let wpConfig = require(library.webpack);
                    if (!out.minified) {
                        wpConfig.mode = "development";
                    }
                    let wpBuild = webpackStream(wpConfig, require("webpack"));

                    //shoud dtsBundle create the declaration?
                    if (settings.build.dtsBundle) {
                        let event = wpBuild
                            .pipe(through.obj(function(file, enc, cb) {
                                // only declaration files
                                const isdts = /\.d\.ts$/.test(file.path);
                                if (isdts) this.push(file);
                                cb();
                            }))
                            .pipe(gulp.dest(outputDirectory));
                        // dts-bundle does NOT support (gulp) streams, so files have to be saved and reloaded, 
                        // until I fix it
                        event.on("end", function() {
                            // create the file
                            dtsBundle.bundle(settings.build.dtsBundle);
                            // prepend the needed reference
                            let fileLocation = path.join(path.dirname(settings.build.dtsBundle.main), settings.build.dtsBundle.out);
                            fs.readFile(fileLocation, function(err, data) {
                                if (err) throw err;
                                data = (settings.build.dtsBundle.prependText || "") + '\n' + data.toString();
                                fs.writeFileSync(fileLocation, data);
                                if (settings.build.processDeclaration) {
                                    var newData = processDeclaration(data, settings.build.processDeclaration);
                                    fs.writeFileSync(fileLocation.replace('.module', ''), newData);
                                }
                            });
                        });
                    }

                    let build = wpBuild
                        .pipe(through.obj(function(file, enc, cb) {
                            // only pipe js files
                            const isJs = /\.js$/.test(file.path);
                            if (isJs) this.push(file);
                            cb();
                        }))
                        .pipe(addModuleExports(library.moduleDeclaration, { subModule: false, extendsRoot: false, externalUsingBabylon: true, noBabylonInit: library.babylonIncluded }));

                    function processDestination(dest) {
                        var outputDirectory = config.build.outputDirectory + dest.outputDirectory;
                        build = build
                            .pipe(rename(dest.filename.replace(".js", library.noBundleInName ? '.js' : ".bundle.js")))
                            .pipe(gulp.dest(outputDirectory));

                        if (library.babylonIncluded && dest.addBabylonDeclaration) {
                            // include the babylon declaration
                            if (dest.addBabylonDeclaration === true) {
                                dest.addBabylonDeclaration = [config.build.declarationFilename];
                            }
                            var decsToAdd = dest.addBabylonDeclaration.map(function(dec) {
                                return config.build.outputDirectory + '/' + dec;
                            });
                            sequence.unshift(gulp.src(decsToAdd)
                                .pipe(rename(function(path) {
                                    path.dirname = '';
                                }))
                                .pipe(gulp.dest(outputDirectory)))
                        }
                    }

                    out.destinations.forEach(dest => {
                        processDestination(dest);
                    });

                    sequence.push(build);

                });
            } else {

                let wpBuild = webpackStream(require(library.webpack), webpack);

                let buildEvent = wpBuild
                    .pipe(gulp.dest(outputDirectory))
                    //back-compat
                    .pipe(through.obj(function(file, enc, cb) {
                        // only js files
                        const isjs = /\.js$/.test(file.path);
                        if (isjs) this.push(file);
                        cb();
                    }))
                    .pipe(rename(function(path) {
                        //path.extname === ".js"
                        path.basename = path.basename.replace(".min", "")
                    })).pipe(gulp.dest(outputDirectory));
                sequence.push(
                    buildEvent
                );
                if (settings.build.dtsBundle || settings.build.processDeclaration) {
                    buildEvent.on("end", function() {
                        if (settings.build.dtsBundle) {
                            dtsBundle.bundle(settings.build.dtsBundle);
                        } if (settings.build.processDeclaration) {
                            let fileLocation = path.join(outputDirectory, settings.build.processDeclaration.filename);
                            fs.readFile(fileLocation, function(err, data) {
                                if (err) throw err;

                                // For Raanan,litera litteral import hack TO BETTER INTEGRATE
                                data = data + "";
                                data = data.replace('import "../sass/main.scss";', "");

                                var newData = processDeclaration(data, settings.build.processDeclaration);
                                fs.writeFileSync(fileLocation.replace('.module', ''), newData);
                                //legacy module support
                                fs.writeFileSync(fileLocation, data + "\n" + newData);
                            });
                        }
                    });
                }
                /*if (settings.build.processDeclaration) {
                    sequence.push(
                        wpBuild
                            .pipe(through.obj(function (file, enc, cb) {
                                // only js files
                                const isDts = /\.d.ts$/.test(file.path);
                                file.contents = new Buffer(processDeclaration(file.contents, settings.build.processDeclaration));
                                if (isDts) this.push(file);
                                cb();
                            }))
                            .pipe(gulp.dest(outputDirectory))
                    )
                }*/
            }

            return merge2(sequence);
        }
        else {
            return waitAll || Promise.resolve();
        }
    }
}

gulp.task("mainBuild", gulp.series("buildWorker", "build"));

/**
 * Build the releasable files.
 */
gulp.task("typescript", gulp.series("typescript-compile", "mainBuild"));

/**
 * Dynamic module creation.
 */
config.modules.map(function(module) {
    gulp.task(module, function() {
        return buildExternalLibraries(config[module]);
    });
});

gulp.task("typescript-libraries", gulp.series(config.modules));

/**
 * Custom build with full path file control; used by profile.html
 */
gulp.task("build-custom", gulp.series("typescript-compile", "build"));

/**
 * Watch ts files from typescript .
 */
gulp.task("srcTscWatch", function() {
    // Reuse The TSC CLI from gulp to enable -w.
    process.argv[2] = "-w";
    process.argv[3] = "-p";
    process.argv[4] = "../../src/tsconfig.json";
    require("./node_modules/typescript/lib/tsc.js");
    return Promise.resolve();
});

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watch", gulp.series("srcTscWatch", function startWatch() {
    var interval = 1000;

    var tasks = [];

    config.modules.map(function(module) {

        config[module].libraries.map(function(library) {
            if (library.webpack) {
                if (library.noWatch) return;
                var outputDirectory = config.build.tempDirectory + config[module].build.distOutputDirectory;
                let wpconfig = require(library.webpack);
                wpconfig.watch = true;
                // dev mode and absolute path sourcemaps for debugging
                wpconfig.mode = "development";
                wpconfig.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]";
                //config.stats = "minimal";
                tasks.push(webpackStream(wpconfig, webpack).pipe(gulp.dest(outputDirectory)))
            } else {
                if (library.files) {
                    tasks.push(gulp.watch(library.files, { interval: interval }, function() {
                        console.log(library.output);
                        return buildExternalLibrary(library, config[module], true)
                            .pipe(debug());
                    }));
                }
                if (library.shaderFiles) {
                    tasks.push(gulp.watch(library.shaderFiles, { interval: interval }, function() {
                        console.log(library.output);
                        return buildExternalLibrary(library, config[module], true)
                            .pipe(debug())
                    }));
                }
                if (library.sassFiles) {
                    tasks.push(gulp.watch(library.sassFiles, { interval: interval }, function() {
                        console.log(library.output);
                        return buildExternalLibrary(library, config[module], true)
                            .pipe(debug())
                    }));
                }
            }
        });
    });

    console.log(tasks.length);

    return Promise.resolve();
}));

gulp.task("intellisense", function() {
    return gulp.src(config.build.intellisenseSources)
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
gulp.task("deployLocalDev", function() {
    return gulp.src("../../localDev/template/**.*")
        .pipe(gulp.dest("../../localDev/src/"));
});

/**
 * Embedded webserver for test convenience.
 */
gulp.task("webserver", function() {
    var options = {
        root: "../../.",
        port: 1338,
        livereload: false,
        middleware: function() {
            return [cors()];
        }
    };

    if (commandLineOptions.public) {
        options.host = "0.0.0.0";
    }

    connect.server(options);
});

/**
 * Combine Webserver and Watch as long as vscode does not handle multi tasks.
 */
gulp.task("run", gulp.series("watch", "webserver"));

/**
 * Cleans map and js files from the src folder.
 */
gulp.task("clean-JS-MAP", function() {
    return del([
        "../../src/**/*.js.map", "../../src/**/*.js"
    ], { force: true });
});

gulp.task("netlify-cleanup", function() {
    //set by netlify
    if (process.env.REPOSITORY_URL) {
        return del([
            "../../inspector/node_modules/**/*", "../../gui/node_modules/**/*",
            "../../Viewer/node_modules/**/*"
        ], { force: true });
    }
    else {
        return Promise.resolve();
    }
})

// this is needed for the modules for the declaration files.
gulp.task("modules-compile", function() {
    const dtsFilter = filter(['**', '!**/*.d.ts'], { restore: false });
    var tsResult = gulp.src(config.typescript)
        .pipe(dtsFilter)
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    // If this gulp task is running on travis
    tsResult.once("error", function(err) {
        tsResult.once("finish", function() {
            console.log("Typescript compile failed");
            console.error(err);
            process.exit(1);
        });
    });

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

gulp.task('prepare-for-modules', /*["modules-compile"],*/ function() {
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

gulp.task('prepare-dependency-tree', gulp.series("prepare-for-modules", function() {
    let tasks = [];

    // now calculate internal dependencies in the .ts files!
    Object.keys(config.workloads).forEach((moduleName) => {
        let tsFiles = config.workloads[moduleName].files.map(f => f.replace(".js", ".ts"))
        let depTask = gulp.src(tsFiles)
            .pipe(calculateDependencies(moduleName, perFile, declared, dependencyTree));

        tasks.push(depTask);
    });

    return merge2(tasks);
}));

// generate the modules directory, along with commonjs modules and es6 modules
// Note - the generated modules are UNMINIFIED! The user will choose whether they want to minify or not.
gulp.task("modules", gulp.series("prepare-dependency-tree", function() {
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
                    .pipe(rename(function(path) {
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
                    .pipe(rename(function(path) {
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
}));

/**
 * Generate the TypeDoc JSON output in order to create code metadata.
 */
gulp.task("typedoc-generate", function() {
    return gulp
        .src([
            "../../dist/preview release/babylon.d.ts",
            "../../dist/preview release/gui/babylon.gui.d.ts",
            "../../dist/preview release/loaders/babylon.glTF2FileLoader.d.ts",
            "../../dist/preview release/serializers/babylon.glTF2Serializer.d.ts",
            "../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"])
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
gulp.task("typedoc-validate", function() {
    return gulp.src(config.build.typedocJSON)
        .pipe(validateTypedoc(config.build.typedocValidationBaseline, "BABYLON", true, false));
});

/**
 * Generate the validation reference to ensure our code is correctly documented.
 */
gulp.task("typedoc-generateValidationBaseline", function() {
    return gulp.src(config.build.typedocJSON)
        .pipe(validateTypedoc(config.build.typedocValidationBaseline, "BABYLON", true, true));
});

/**
 * Validate the code comments and style case convention through typedoc and
 * generate the new baseline.
 */
gulp.task("typedoc-all", gulp.series("typedoc-generate", "typedoc-validate", "typedoc-generateValidationBaseline"));


/**
 * Validate compile the code and check the comments and style case convention through typedoc
 */
gulp.task("typedoc-check", gulp.series("typescript-compile", "gui", "loaders", "serializers", "typedoc-generate", "typedoc-validate"));

/**
 * Launches the KARMA validation tests in chrome in order to debug them.
 * (Can only be launch locally.)
 */
gulp.task("tests-validation-karma", function(done) {
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
gulp.task("tests-validation-virtualscreen", function(done) {
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
gulp.task("tests-validation-browserstack", function(done) {
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
gulp.task("tests-unit-transpile", function(done) {
    var tsProject = typescript.createProject('../../tests/unit/tsconfig.json');

    var tsResult = gulp.src("../../tests/unit/**/*.ts", { base: "../../" })
        .pipe(tsProject());

    tsResult.once("error", function() {
        tsResult.once("finish", function(err) {
            console.log("Typescript compile failed");
            console.error(err);
            process.exit(1);
        });
    });

    return tsResult.js.pipe(gulp.dest("../../"));
});

/**
 * Launches the KARMA unit tests in phantomJS.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-unit-debug", gulp.series("tests-unit-transpile", function(done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../tests/unit/karma.conf.js",
        singleRun: false,
        browsers: ['Chrome']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

gulp.task("tests-babylon-unit", gulp.series("tests-unit-transpile", function(done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../tests/unit/karma.conf.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

var rmDir = function(dirPath) {
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
 * Transpiles viewer typescript unit tests. 
 */
gulp.task("tests-viewer-validation-transpile", function() {

    let wpBuild = webpackStream(require('../../Viewer/webpack.gulp.config.js'), webpack);

    // clean the built directory
    rmDir("../../Viewer/tests/build/");

    return wpBuild
        .pipe(rename(function(path) {
            if (path.extname === '.js') {
                path.basename = "test";
            }
        }))
        .pipe(gulp.dest("../../Viewer/tests/build/"));
});

/**
 * Launches the viewer's KARMA validation tests in chrome in order to debug them.
 * (Can only be launch locally.)
 */
gulp.task("tests-viewer-validation-karma", gulp.series("tests-viewer-validation-transpile", function(done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/validation/karma.conf.js",
        singleRun: false
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA validation tests in ff or virtual screen ff on travis for a quick analysis during the build.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-viewer-validation-virtualscreen", gulp.series("tests-viewer-validation-transpile", function(done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/validation/karma.conf.js",
        singleRun: true,
        browsers: ['Firefox']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA validation tests in browser stack for remote and cross devices validation tests.
 * (Can only be launch from secure branches.)
 */
gulp.task("tests-viewer-validation-browserstack", gulp.series("tests-viewer-validation-transpile", function(done) {
    if (!process.env.BROWSER_STACK_USERNAME) {
        done();
        return;
    }

    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/validation/karma.conf.browserstack.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Transpiles viewer typescript unit tests. 
 */
gulp.task("tests-viewer-transpile", function() {

    let wpBuild = webpackStream(require('../../Viewer/tests/unit/webpack.config.js'), webpack);

    // clean the built directory
    rmDir("../../Viewer/tests/build/");

    return wpBuild
        .pipe(rename(function(path) {
            if (path.extname === '.js') {
                path.basename = "test";
            }
        }))
        .pipe(gulp.dest("../../Viewer/tests/build/"));
});

/**
 * Launches the KARMA unit tests in chrome.
 * (Can be launch on any branches.)
 */
gulp.task("tests-viewer-unit-debug", gulp.series("tests-viewer-transpile", function(done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/karma.conf.js",
        singleRun: false,
        browsers: ['Chrome']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA unit tests in phantomJS.
 * (Can be launch on any branches.)
 */
gulp.task("tests-viewer-unit", gulp.series("tests-viewer-transpile", function(done) {
    var kamaServerOptions = {
        configFile: __dirname + "/../../Viewer/tests/karma.conf.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA unit tests in phantomJS.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-unit", gulp.series("tests-babylon-unit", "tests-viewer-unit"));

gulp.task("tests-modules", function() {
    let testsToRun = require('../../tests/modules/tests.json');

    let sequencePromise = Promise.resolve();

    testsToRun.tests.forEach(test => {
        sequencePromise = sequencePromise.then(() => {
            console.log("Running " + test.name);
            let basePath = '../../tests/modules/' + test.name + '/';
            rmDir("../../tests/modules/build/");
            let compilePromise = Promise.resolve();

            if (test.dependencies) {
                compilePromise = new Promise(function(resolve, reject) {
                    let counter = 0;
                    let copyTask = gulp.src(test.dependencies.map(dep => config.build.outputDirectory + '/' + dep)).pipe(rename(function(path) {
                        path.basename = (counter++) + '';
                    })).pipe(gulp.dest("../../tests/modules/build/dependencies/"))
                    copyTask.once("finish", resolve);
                })
            }
            // any compilation needed?
            if (test.typescript || test.bundler) {
                //typescript only
                if (test.typescript && !test.bundler) {
                    compilePromise = compilePromise.then(() => {
                        return new Promise(function(resolve, reject) {
                            var tsProject = typescript.createProject(basePath + (test.tsconfig || 'tsconfig.json'));

                            var tsResult = gulp.src(basePath + '/src/**/*.ts', { base: basePath })
                                .pipe(tsProject());

                            let error = false;
                            tsResult.once("error", function() {
                                error = true;
                            });

                            let jsPipe = tsResult.js.pipe(gulp.dest("../../tests/modules/"));

                            jsPipe.once("finish", function() {
                                if (error)
                                    reject('error compiling test');
                                else
                                    resolve();
                            });
                        });
                    });
                } else {
                    if (test.bundler === 'webpack') {
                        console.log("webpack");
                        compilePromise = compilePromise.then(() => {
                            return new Promise(function(resolve, reject) {
                                let wpBuild = webpackStream(require(basePath + '/webpack.config.js'), webpack);

                                wpBuild = wpBuild
                                    .pipe(rename(function(path) {
                                        if (path.extname === '.js') {
                                            path.basename = "tests-loader";
                                        }
                                    }))
                                    .pipe(gulp.dest("../../tests/modules/build/"));

                                wpBuild.once("finish", resolve);
                            })
                        });
                    }
                }
            }

            return compilePromise.then(() => {
                return new Promise(function(resolve, reject) {
                    var kamaServerOptions = {
                        configFile: __dirname + "/../../tests/modules/karma.conf.js",
                        singleRun: true
                    };

                    var server = new karmaServer(kamaServerOptions, resolve);
                    server.start();
                });
            })
        })
    });

    return sequencePromise;
});

gulp.task("tests-whatsnew", function(done) {
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
            fs.readFile("../../dist/preview release/what's new.md", "utf-8", function(err, newData) {
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

/**
 * Do it all.
 */
gulp.task("typescript-all", gulp.series("typescript", "typescript-libraries", "netlify-cleanup"));

/**
 * The default task, concat and min the main BJS files.
 */
gulp.task("default", gulp.series("tsLint", "typescript-all", "intellisense", "typedoc-all", "tests-unit", "tests-modules", "tests-validation-virtualscreen", "tests-validation-browserstack"));
