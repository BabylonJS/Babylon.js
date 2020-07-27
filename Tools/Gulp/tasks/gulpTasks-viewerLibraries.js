// Gulp Tools
var gulp = require("gulp");
var webpackStream = require("webpack-stream");
var dtsBundle = require('dts-bundle');
var merge2 = require("merge2");
var through = require('through2');
var path = require("path");
var rename = require("gulp-rename");

// Gulp Helpers
var processDeclaration = require('../helpers/gulp-processModuleDeclarationToNamespace');
var addModuleExports = require("../helpers/gulp-addModuleExports");
// Import Build Config
var config = require("../../Config/config.json");

const webpack = require("webpack");

/**
 * Build the viewer
 */
var buildViewerLibrary = function (library, settings, out) {
    const sequence = [];
    var outputDirectory = config.build.outputDirectory + settings.build.distOutputDirectory;

    let wpConfig = require(settings.build.webpack);
    if (!out.minified) {
        wpConfig.mode = "development";
    }

    let wpBuild = webpackStream({ config: wpConfig }, webpack);

    //shoud dtsBundle create the declaration?
    if (settings.build.dtsBundle) {
        let event = wpBuild
            .pipe(through.obj(function (file, enc, cb) {
                // only declaration files
                const isdts = /\.d\.ts$/.test(file.path);
                if (isdts) this.push(file);
                cb();
            }))
            .pipe(gulp.dest(outputDirectory));
        // dts-bundle does NOT support (gulp) streams, so files have to be saved and reloaded, 
        // until I fix it
        event.on("end", function () {
            // create the file
            dtsBundle.bundle(settings.build.dtsBundle);
            // process the declaration
            let fileLocation = path.join(path.dirname(settings.build.dtsBundle.main), settings.build.dtsBundle.out);
            processDeclaration(fileLocation, settings.build.umd.packageName, settings.build.umd.processDeclaration);
        });
    }

    let build = wpBuild
        .pipe(through.obj(function (file, enc, cb) {
            // only pipe js files
            const isJs = /\.js$/.test(file.path);
            if (isJs) this.push(file);
            cb();
        }))
        .pipe(addModuleExports(library.moduleDeclaration, {
            subModule: false,
            extendsRoot: false,
            externalUsingBabylon: true,
            noBabylonInit: true
        }));

    function processDestination(dest) {
        var outputDirectory = config.build.outputDirectory + dest.outputDirectory;
        build = build
            .pipe(rename(dest.filename))
            .pipe(gulp.dest(outputDirectory));

        if (dest.addBabylonDeclaration) {
            // include the babylon declaration
            if (dest.addBabylonDeclaration === true) {
                dest.addBabylonDeclaration = ["babylon.module.d.ts"];
            }
            var decsToAdd = dest.addBabylonDeclaration.map(function (dec) {
                return config.build.outputDirectory + '/' + dec;
            });
            sequence.unshift(gulp.src(decsToAdd)
                .pipe(rename(function (path) {
                    path.dirname = '';
                }))
                .pipe(gulp.dest(outputDirectory)))
        }
    }

    out.destinations.forEach(dest => {
        processDestination(dest);
    });

    sequence.push(build);

    // });

    return merge2(sequence);
}

function buildViewerOutputs(settings, library) {
    var outputBuilds = settings.build.outputs.map(out => {
        var buildOutput = function () {
            return buildViewerLibrary(library, settings, out);
        }
        return buildOutput;
    });
    return (outputBuilds);
}

/**
 * Dynamic viewer module creation In Serie for WebPack leaks.
 */
function buildViewerLibraries(settings) {
    var tasks = settings.libraries.map(function (library) {
        return buildViewerOutputs(settings, library);
    });

    return gulp.series.apply(this, tasks);
}


/**
 * Dynamic viewer module creation.
 */
config.viewerModules.map(function (module) {
    var settings = config[module];

    // Build the libraries.
    gulp.task(module, buildViewerLibraries(settings));
});