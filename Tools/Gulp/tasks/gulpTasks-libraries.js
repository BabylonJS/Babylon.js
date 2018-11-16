// Gulp Tools
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var cp = require('child_process');
var merge2 = require("merge2");
var path = require("path");

// Gulp Helpers
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var processShaders = require("../helpers/gulp-processShaders");
var processAmdDeclarationToModule = require('../helpers/gulp-processAmdDeclarationToModule');
var processModuleDeclarationToNamespace = require('../helpers/gulp-processModuleDeclarationToNamespace');
var rmDir = require("../helpers/gulp-rmDir");

// Import Build Config
var config = require("../config.json");

/**
 * Create shader ts files.
 */
var buildShaders = function(settings) {
    return gulp.src(settings.build.srcDirectory + "**/*.fx")
            .pipe(uncommentShaders())
            .pipe(processShaders(settings.isCore));
}

/**
 * Build a single library (one of the material of mat lib) from a module (materialsLibrary for instance)
 */
var buildExternalLibrariesMultiEntry = function(libraries, settings, cb) {
    // Convert Module to Namespace for globals
    const sequence = [];
    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

    var isMinOutputName = libraries[0].output.indexOf(".min.") > -1;

    // Webpack Config.
    var wpConfig = require(settings.build.webpack);
    wpConfig.entry = { };
    wpConfig.output.filename = isMinOutputName ? '[name].js' : '[name].min.js';
    for (let library of settings.libraries) {
        let name = library.output.replace(isMinOutputName ? ".js" : ".min.js", "");
        wpConfig.entry[name] = path.resolve(wpConfig.context, library.entry);
    }

    // Generate minified file.
    let wpBuildMin = webpackStream(wpConfig, webpack);
    let buildEventMin = wpBuildMin.pipe(gulp.dest(outputDirectory));
    sequence.push(buildEventMin);

    // Generate unminified file.
    wpConfig.mode = "development";
    // Allow babylon.max.js and babylon.js
    wpConfig.output.filename = isMinOutputName ? '[name].max.js' : '[name].js';
    //wpConfig.output.filename = library.maxOutput || wpConfig.output.filename.replace(".min", "");
    let wpBuildMax = webpackStream(wpConfig, webpack);
    let buildEventMax = wpBuildMax.pipe(gulp.dest(outputDirectory));
    sequence.push(buildEventMax);

    return merge2(sequence)
        .on("end", function() {
            // TODO. Generate all d.ts
            let library = libraries[0];
            if (!library.preventLoadLibrary) {
                let fileLocation = path.join(outputDirectory, settings.build.processDeclaration.filename);
                // Generate DTS the Dts Bundle way...
                // dtsBundle.bundle(settings.build.dtsBundle);

                let srcDirectory = settings.build.srcDirectory;
                let depthCount = srcDirectory.match(/\//g).length - srcDirectory.match(/\.\.\//g).length;
                let tempDirectory = "";
                for (let i = 0; i < depthCount; i++) {
                    tempDirectory += "../"
                }
                tempDirectory += ".temp/";

                // Generate DTS the old way...
                cp.execSync('tsc --module amd --outFile "' + tempDirectory + 'amd.js" --emitDeclarationOnly true', {
                    cwd: settings.build.srcDirectory
                });

                // Convert the tsc AMD BUNDLED declaration to our expected one
                processAmdDeclarationToModule("../../.temp/amd.d.ts", {
                    output: fileLocation,
                    moduleName: settings.build.processDeclaration.packageName,
                    entryPoint: library.entry
                });

                // Convert Module to Namespace for globals
                processModuleDeclarationToNamespace(fileLocation, settings.build.processDeclaration);
            }
            cb();
        });
}

/**
 * Dynamic module creation In Serie for WebPack leaks.
 */
function buildExternalLibraries(settings) {
    // Clean up old build files.
    rmDir(settings.build.dtsBundle.baseDir);

    // Creates the required tasks.
    var tasks = [];
    var shaders = function() { return buildShaders(settings); };
    var build = function(cb) { return buildExternalLibrariesMultiEntry(settings.libraries, settings, cb) };

    tasks.push(shaders, build);

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic module creation.
 */
config.modules.map(function(module) {
    const settings = config[module];
    gulp.task(module, buildExternalLibraries(settings));
});