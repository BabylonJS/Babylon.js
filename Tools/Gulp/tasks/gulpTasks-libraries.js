// Gulp Tools
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var cp = require('child_process');
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
var buildExternalLibrariesMultiEntry = function(libraries, settings, isMin) {
    // Convert Module to Namespace for globals
    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

    // Does name contain .min. for min files.
    var isMinOutputName = libraries[0].output.indexOf(".min.") > -1;

    // Webpack Config.
    var wpConfig = require(settings.build.webpack);
    // Create multi entry list.
    wpConfig.entry = { };
    for (let library of settings.libraries) {
        let name = library.output.replace(isMinOutputName ? ".min.js" : ".js", "");
        wpConfig.entry[name] = path.resolve(wpConfig.context, library.entry);
    }

    // Create output by type (min vs max).
    if (isMin) {
        wpConfig.output.filename = isMinOutputName ? '[name].min.js' : '[name].js';
    }
    else {
        // Generate unminified file.
        wpConfig.mode = "development";
        wpConfig.output.filename = isMinOutputName ? '[name].js' : '[name].max.js';
    }

    // Generate minified file.
    let wpBuild = webpackStream(wpConfig, webpack);
    return wpBuild.pipe(gulp.dest(outputDirectory));
}

/**
 * Build DTS Files
 */
var buildDTSFiles = function(libraries, settings, cb) {
    // Convert Module to Namespace for globals
    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

    // TODO. Generate all d.ts
    let library = libraries[0];
    if (!library.preventLoadLibrary) {
        // Find declaration path.
        let fileLocation = path.join(outputDirectory, settings.build.processDeclaration.filename);

        // Create temp directory.
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
            entryPoint: library.entry,
            externals: settings.build.processDeclaration.classMap,
        });

        // Convert Module to Namespace for globals
        processModuleDeclarationToNamespace(fileLocation, settings.build.processDeclaration);
    }
    cb();
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
    var buildMin = function() { return buildExternalLibrariesMultiEntry(settings.libraries, settings, true) };
    var buildMax = function() { return buildExternalLibrariesMultiEntry(settings.libraries, settings, false) };
    var buildDTS = function(cb) { return buildDTSFiles(settings.libraries, settings, cb) };

    tasks.push(shaders, buildMin, buildMax, buildDTS);

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic module creation.
 */
config.modules.map(function(module) {
    const settings = config[module];
    gulp.task(module, buildExternalLibraries(settings));
});