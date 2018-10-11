// Gulp Tools
var gulp = require("gulp");
var uglify = require("gulp-uglify");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var srcToVariable = require("gulp-content-to-variable");
var merge2 = require("merge2");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var cleants = require("gulp-clean-ts-extends");
var replace = require("gulp-replace");
var expect = require("gulp-expect-file");
var optimisejs = require("gulp-optimize-js");
var filter = require('gulp-filter');
var path = require("path");

// Gulp Helpers
var addDtsExport = require("./helpers/gulp-addDtsExport");
var addDecorateAndExtends = require("./helpers/gulp-decorateAndExtends");
var addModuleExports = require("./helpers/gulp-addModuleExports");
var addES6Exports = require("./helpers/gulp-addES6Exports");
var uncommentShader = require("./helpers/gulp-removeShaderComments");

// Import Gulp Tasks
require("./tasks/gulpTasks-libraries");
require("./tasks/gulpTasks-viewerLibraries");
require("./tasks/gulpTasks-tsLint");
require("./tasks/gulpTasks-netlify");
require("./tasks/gulpTasks-whatsNew");
require("./tasks/gulpTasks-localRun");
require("./tasks/gulpTasks-watch");
require("./tasks/gulpTasks-typedoc");
require("./tasks/gulpTasks-intellisense");
require("./tasks/gulpTasks-tests");

// Import Build Config
var config = require("./config.json");

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
 * Compiles all typescript files and creating a js and a declaration file.
 */
gulp.task("typescript-compile", function() {
    const dtsFilter = filter(['**', '!**/*.d.ts'], {restore: false});
    var tsResult = gulp.src(config.typescript)
        .pipe(dtsFilter)
        .pipe(sourcemaps.init())
        .pipe(tsProject({
            summarizeFailureOutput: true
        }));

    //If this gulp task is running on travis, file the build!
    if (process.env.TRAVIS) {
        tsResult.once("error", function() {
            tsResult.once("finish", function() {
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
 * Build the releasable files.
 */
gulp.task("typescript", gulp.series("typescript-compile", "buildWorker", "build"));

/**
 * Build all libs.
 */
gulp.task("typescript-libraries", gulp.series(config.modules, config.viewerModules));

/**
 * Custom build with full path file control; used by profile.html
 */
gulp.task("build-custom", gulp.series("typescript-compile", "build"));

/**
 * Validate compile the code and check the comments and style case convention through typedoc
 */
gulp.task("typedoc-check", gulp.series("typescript-compile", "gui", "loaders", "serializers", "typedoc-generate", "typedoc-validate"));

/**
 * Combine Webserver and Watch as long as vscode does not handle multi tasks.
 */
gulp.task("run", gulp.series("watch", "webserver"));

/**
 * Do it all (Build).
 */
gulp.task("typescript-all", gulp.series("typescript", "typescript-libraries", "netlify-cleanup"));

/**
 * Do it all (tests).
 */
gulp.task("tests-all", gulp.series("tests-unit", "tests-modules", "tests-validation-virtualscreen", "tests-validation-browserstack"));

/**
 * The default task, concat and min the main BJS files.
 */
gulp.task("default", gulp.series("tsLint", "typescript-all", "intellisense", "typedoc-all", "tests-all"));
