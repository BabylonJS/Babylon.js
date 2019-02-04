// Gulp Tools
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var cp = require('child_process');
var path = require("path");
var concat = require('gulp-concat');
var minimist = require("minimist");

// Gulp Helpers
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var processShaders = require("../helpers/gulp-processShaders");
var processAmdDeclarationToModule = require('../helpers/gulp-processAmdDeclarationToModule');
var processModuleDeclarationToNamespace = require('../helpers/gulp-processModuleDeclarationToNamespace');
var del = require("del");

// Parse Command Line.
var commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["noNamespace"],
    string: ["moduleName"],
    string: ["tscPath"]
});

// Import Build Config
var config = require("../../Config/config.js");

/**
 * Clean shader ts files.
 */
var cleanShaders = function(settings) {
    return del(settings.computed.shaderTSGlob, { force: true });
}

/**
 * Create shader ts files.
 */
var buildShaders = function(settings) {
    return gulp.src(settings.computed.shaderGlob)
            .pipe(uncommentShaders())
            .pipe(processShaders(settings.isCore));
}

/**
 * Build a single library (one of the material of mat lib) from a module (materialsLibrary for instance)
 */
var buildExternalLibrariesMultiEntry = function(libraries, settings, isMin) {
    // Convert Module to Namespace for globals
    var outputDirectory = settings.computed.distDirectory;

    // Does name contain .min. for min files.
    var isMinOutputName = libraries[0].output.indexOf(".min.") > -1;

    // Webpack Config.
    var wpConfig = require(settings.computed.webpackConfigPath);

    // Create multi entry list.
    wpConfig.entry = { };
    for (let library of settings.libraries) {
        let name = library.output.replace(isMinOutputName ? ".min.js" : ".js", "");
        wpConfig.entry[name] = library.computed.entryPath;
    }

    // Create output by type (min vs max).
    if (isMin) {
        delete wpConfig.devtool;
        wpConfig.output.filename = isMinOutputName ? '[name].min.js' : '[name].js';
    }
    else {
        // Map Output
        wpConfig.devtool = "source-map";
        wpConfig.output.devtoolModuleFilenameTemplate = (info) => {
            info.resourcePath = path.normalize(info.resourcePath);

            if (!path.isAbsolute(info.resourcePath)) {
                info.resourcePath = path.join(settings.computed.srcDirectory, info.resourcePath);
            }

            return `webpack://BABYLONJS/${path.relative(config.computed.rootFolder, info.resourcePath).replace(/\\/g, "/")}`;
        };

        // Generate unminified file.
        wpConfig.mode = "development";
        wpConfig.output.filename = isMinOutputName ? '[name].js' : '[name].max.js';
    }

    // Generate minified file.
    let wpBuild = webpackStream(wpConfig, webpack);
    return wpBuild.pipe(gulp.dest(outputDirectory));
}

/**
 * Build AMD DTS Files
 */
var buildAMDDTSFiles = function(libraries, settings, cb) {
    // TODO. Generate all d.ts
    let library = libraries[0];
    if (!library.preventLoadLibrary) {
        // Generate DTS the old way...
        cp.execSync(`node "${commandLineOptions.tscPath || config.computed.tscPath}" --module amd --outFile "${config.computed.tempTypingsAMDFilePath}" --emitDeclarationOnly true`, {
            cwd: settings.computed.srcDirectory
        });
    }
    cb();
}

/**
 * Append Lose DTS Files allowing isolated Modules build
 */
var appendLoseDTSFiles = function(settings) {
    if (settings.build.loseDTSFiles) {
        return gulp.src([config.computed.tempTypingsFilePath, path.join(settings.computed.srcDirectory, settings.build.loseDTSFiles.glob)])
            .pipe(concat(config.computed.tempTypingsFileName))
            .pipe(gulp.dest(config.computed.tempFolder));
    }
    return Promise.resolve();
}

/**
 * Process DTS Files
 */
var processDTSFiles = function(libraries, settings, cb) {
    // Convert Module to Namespace for globals
    var outputDirectory = settings.computed.distDirectory;

    // TODO. Generate all d.ts
    let library = libraries[0];
    if (!library.preventLoadLibrary) {
        // Find declaration path.
        let fileLocation = path.join(outputDirectory, settings.build.umd.processDeclaration.filename);

        // Convert the tsc AMD BUNDLED declaration to our expected one
        processAmdDeclarationToModule(config.computed.tempTypingsFilePath, {
            output: fileLocation,
            moduleName: commandLineOptions.moduleName || settings.build.umd.packageName,
            entryPoint: library.entry,
            externals: settings.build.umd.processDeclaration.classMap,
        });

        // Convert Module to Namespace for globals
        if (!commandLineOptions.noNamespace) {
            processModuleDeclarationToNamespace(fileLocation, settings.build.umd.packageName, settings.build.umd.processDeclaration);
        }
    }
    cb();
}

/**
 * Dynamic module creation In Serie for WebPack leaks.
 */
function buildExternalLibraries(settings) {
    // Creates the required tasks.
    var tasks = [];

    var cleanup = function() { return cleanShaders(settings); };
    var shaders = function() { return buildShaders(settings); };
    var buildMin = function() { return buildExternalLibrariesMultiEntry(settings.libraries, settings, true) };
    var buildMax = function() { return buildExternalLibrariesMultiEntry(settings.libraries, settings, false) };

    var buildAMDDTS = function(cb) { return buildAMDDTSFiles(settings.libraries, settings, cb) };
    var appendLoseDTS = function() { return appendLoseDTSFiles(settings) };
    var processDTS = function(cb) { return processDTSFiles(settings.libraries, settings, cb) };

    tasks.push(cleanup, shaders, buildMin, buildMax, buildAMDDTS, appendLoseDTS, processDTS);

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic module creation.
 */
config.modules.map(function(module) {
    const settings = config[module];
    gulp.task(module, buildExternalLibraries(settings));
});

/**
 * Build the releasable files.
 * Back Compat Only, now name core as it is a lib
 */
gulp.task("typescript", gulp.series("core"));

/**
 * Build all libs.
 */
gulp.task("typescript-libraries", gulp.series(config.modules, config.viewerModules));
