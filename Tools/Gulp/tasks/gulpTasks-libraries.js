// Gulp Tools
var gulp = require("gulp");
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var cp = require('child_process');
var path = require("path");
var concat = require("gulp-concat");

// Gulp Helpers
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var processShaders = require("../helpers/gulp-processShaders");
var processAmdDeclarationToModule = require('../helpers/gulp-processAmdDeclarationToModule');
var processModuleDeclarationToNamespace = require('../helpers/gulp-processModuleDeclarationToNamespace');
var del = require("del");

// Import Build Config
var configPath = "../config.json";
var config = require(configPath);

// Constants
const tempTypingsFile = "tempTypings.js";
const tempTypingsFolder = "../../.temp/";
const tempTypingsPath = tempTypingsFolder + tempTypingsFile.replace(".js", ".d.ts");

/**
 * Clean shader ts files.
 */
var cleanShaders = function(settings) {
    return del([settings.build.srcDirectory + "**/*.fx.ts"]);
}

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
    var configFolder = path.dirname(path.resolve(__dirname, configPath));
    var wpConfigPath = path.join(settings.build.mainFolder, "webpack.config.js");
    var wpConfig = require(path.resolve(configFolder, wpConfigPath));

    // Create multi entry list.
    wpConfig.entry = { };
    for (let library of settings.libraries) {
        let name = library.output.replace(isMinOutputName ? ".min.js" : ".js", "");
        wpConfig.entry[name] = path.resolve(wpConfig.context, library.entry);
    }

    // Create output by type (min vs max).
    if (isMin) {
        delete wpConfig.devtool;
        wpConfig.output.filename = isMinOutputName ? '[name].min.js' : '[name].js';
    }
    else {
        // Map Output
        wpConfig.devtool = "source-map";
        var rootPath = path.resolve(__dirname, "../../../");
        var absoluteSrc = path.resolve(__dirname, "../", settings.build.srcDirectory);
        wpConfig.output.devtoolModuleFilenameTemplate = (info) => {
            info.resourcePath = path.normalize(info.resourcePath);

            if (!path.isAbsolute(info.resourcePath)) {
                info.resourcePath = path.join(absoluteSrc, info.resourcePath);
            }

            return `webpack://BABYLONJS/${path.relative(rootPath, info.resourcePath).replace(/\\/g, "/")}`;
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
        // Create temp directory.
        let srcDirectory = settings.build.srcDirectory;
        let depthCount = srcDirectory.match(/\//g).length - srcDirectory.match(/\.\.\//g).length;
        let tempDirectory = "";
        for (let i = 0; i < depthCount; i++) {
            tempDirectory += "../"
        }
        tempDirectory += ".temp/";

        // Generate DTS the old way...
        cp.execSync('tsc --module amd --outFile "' + tempDirectory + tempTypingsFile + '" --emitDeclarationOnly true', {
            cwd: settings.build.srcDirectory
        });
    }
    cb();
}

/**
 * Append Lose DTS Files allowing isolated Modules build
 */
var appendLoseDTSFiles = function(settings) {
    if (settings.build.loseDTSFiles) {
        return gulp.src([tempTypingsPath, path.join(settings.build.srcDirectory, settings.build.loseDTSFiles)], { base: "./"})
            .pipe(concat(tempTypingsPath))
            .pipe(gulp.dest(tempTypingsPath));
    }
    return Promise.resolve();
}

/**
 * Process DTS Files
 */
var processDTSFiles = function(libraries, settings, cb) {
    // Convert Module to Namespace for globals
    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

    // TODO. Generate all d.ts
    let library = libraries[0];
    if (!library.preventLoadLibrary) {
        // Find declaration path.
        let fileLocation = path.join(outputDirectory, settings.build.processDeclaration.filename);

        // Convert the tsc AMD BUNDLED declaration to our expected one
        processAmdDeclarationToModule(tempTypingsPath, {
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